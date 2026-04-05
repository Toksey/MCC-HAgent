'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Clock, Database, Hash, Send, AlertCircle, Terminal, RefreshCw } from 'lucide-react';
import { relativeTime, truncate } from '@/lib/parsers';

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

interface Session {
  id: string;
  agentId: string;
  key: string;
  label: string;
  sizeBytes: number;
  modifiedAt: string;
}

interface Message {
  role: string;
  content: string;
  timestamp: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function MessageBubble({ msg, agentName, agentEmoji }: { msg: Message; agentName: string; agentEmoji: string }) {
  const isUser = msg.role === 'user';

  // Detect tool use or system content
  const isTool = msg.content.startsWith('[') || msg.content.includes('```tool');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '10px',
      marginBottom: '16px',
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isUser ? '14px' : '16px', marginTop: '2px', alignSelf: 'flex-end',
        boxShadow: isUser ? '0 2px 8px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {isUser ? <User size={15} color="white" /> : agentEmoji}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '80%', minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)',
          marginBottom: '4px', padding: '0 4px'
        }}>
          {isUser ? 'Mo' : agentName}
          {msg.timestamp && ` · ${relativeTime(msg.timestamp)}`}
        </div>
        
        {isTool ? (
          <div style={{
            padding: '12px 14px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)', fontSize: '12px',
            fontFamily: 'var(--font-mono)', overflowX: 'auto',
            position: 'relative', width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Terminal size={12} />
              Tool Execution
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content.length > 2000 ? msg.content.slice(0, 2000) + '\n\n[…truncated long output]' : msg.content}
            </pre>
          </div>
        ) : (
          <div style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? 'var(--accent-primary)' : 'var(--bg-card)',
            border: isUser ? 'none' : '1px solid var(--border-default)',
            color: isUser ? 'white' : 'var(--text-primary)',
            fontSize: '13.5px', lineHeight: '1.6', wordBreak: 'break-word',
            boxShadow: isUser ? '0 2px 12px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-polling for new messages if at bottom
  useEffect(() => {
    if (!selectedSession || !selectedAgent) return;
    const interval = setInterval(() => {
      fetch(`/api/sessions?agentId=${selectedAgent.id}&sessionId=${selectedSession.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.messages) {
            setMessages(prev => {
              // Only update if we have new messages to prevent flashing
              if (prev.length !== d.messages.length) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                return d.messages;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedSession, selectedAgent]);

  // Fetch agents on mount
  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(d => {
        if (d.agents) {
          const fetchedAgents = d.agents.map((a: AgentData) => ({
            id: a.id,
            name: a.name,
            emoji: a.emoji,
            role: a.role || 'Agent',
          }));
          setAgents(fetchedAgents);
          if (fetchedAgents.length > 0) {
            setSelectedAgent(fetchedAgents[0]);
          }
        }
      });
  }, []);

  // Fetch sessions when agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    setLoadingSessions(true);
    setSessions([]);
    setSelectedSession(null);
    setMessages([]);

    fetch(`/api/sessions?agentId=${selectedAgent.id}`)
      .then(r => r.json())
      .then(d => {
        const nextSessions = d.sessions || [];
        setSessions(nextSessions);
        setSelectedSession(nextSessions[0] || null);
        setLoadingSessions(false);
      })
      .catch(() => setLoadingSessions(false));
  }, [selectedAgent]);

  // Fetch messages when session changes
  useEffect(() => {
    if (!selectedSession || !selectedAgent) return;
    setLoadingMessages(true);
    fetch(`/api/sessions?agentId=${selectedAgent.id}&sessionId=${selectedSession.id}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages || []);
        setLoadingMessages(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => setLoadingMessages(false));
  }, [selectedSession]);

  const getSessionLabel = (s: Session) => {
    // Try to extract a meaningful label from the session key
    const key = s.key;
    if (key.includes('whatsapp')) return '📱 WhatsApp';
    if (key.includes('telegram')) return '✈️ Telegram';
    if (key.includes('cron')) return '⏰ Cron Job';
    if (key.includes('main') && !key.includes('whatsapp')) return '💬 Direct';
    return `💬 ${s.id.slice(0, 8)}`;
  };

  return (
    <div className="page-enter" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Sidebar — agent + session list */}
      <div style={{
        width: '280px', minWidth: '240px', flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)',
      }}>
        {/* Agent switcher */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {agents.map((agent: AgentData) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                  borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                  background: selectedAgent?.id === agent.id ? 'var(--accent-subtle)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (selectedAgent?.id !== agent.id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={e => { if (selectedAgent?.id !== agent.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '18px' }}>{agent.emoji}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: selectedAgent?.id === agent.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{agent.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={12} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sessions ({sessions.length})
            </span>
          </div>
          <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {loadingSessions ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Loading…</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No sessions found</div>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  style={{
                    width: '100%', padding: '10px 10px', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                    background: selectedSession?.id === s.id ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background var(--transition-fast)', display: 'block',
                  }}
                  onMouseEnter={e => { if (selectedSession?.id !== s.id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { if (selectedSession?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 500, color: selectedSession?.id === s.id ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '3px' }}>
                    {getSessionLabel(s)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>{formatBytes(s.sizeBytes)}</span>
                    <span>·</span>
                    <span>{relativeTime(s.modifiedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedSession || !selectedAgent ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px' }}>Select a session to view conversation history</div>
              {selectedAgent && (
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-tertiary)' }}>
                  {sessions.length} sessions available for {selectedAgent.name}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
              background: 'var(--bg-surface)',
            }}>
              <span style={{ fontSize: '20px' }}>{selectedAgent.emoji}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedAgent.name} — {getSessionLabel(selectedSession)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {formatBytes(selectedSession.sizeBytes)} · {relativeTime(selectedSession.modifiedAt)} · Read-only history
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                {messages.length} messages loaded
              </div>
            </div>

            {/* Messages */}
            <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <Database size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <div style={{ fontSize: '14px' }}>No cognitive messages are available yet</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>Send a message to seed this Hermes session.</div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={i}
                      msg={msg}
                      agentName={selectedAgent.name}
                      agentEmoji={selectedAgent.emoji}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Live input bar */}
            <div style={{
              padding: '16px 24px 24px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)', flexShrink: 0,
            }}>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!inputText.trim() || sending) return;
                  setSending(true);
                  
                  // Optimistic UI update
                  const tempMsg = { role: 'user', content: inputText, timestamp: new Date().toISOString() };
                  setMessages(prev => [...prev, tempMsg]);
                  setInputText('');
                  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

                  try {
                    const res = await fetch('/api/chat/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        agentId: selectedAgent.id,
                        sessionId: selectedSession.id,
                        content: tempMsg.content
                      })
                    });
                    const data = await res.json();
                    if (data.messages) {
                      setMessages(data.messages);
                    }
                    if (data.offline) {
                      setOfflineMode(true);
                    } else {
                      setOfflineMode(false);
                    }
                  } catch (err) {
                    console.error('Send failed', err);
                  } finally {
                    setSending(false);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', background: 'var(--bg-card)',
                  border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-lg)',
                  padding: '8px 12px 8px 16px', gap: '12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
                }}
              >
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  placeholder={`Message ${selectedAgent.name}...`}
                  style={{ 
                    flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', 
                    fontSize: '14px', outline: 'none'
                  }} 
                />
                <button 
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  style={{
                    background: inputText.trim() && !sending ? 'var(--accent-primary)' : 'var(--bg-elevated)', 
                    border: 'none', borderRadius: 'var(--radius-md)', padding: '8px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: inputText.trim() && !sending ? 'white' : 'var(--text-muted)',
                    cursor: inputText.trim() && !sending ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                >
                  {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                </button>
              </form>
              <div style={{ fontSize: '11px', color: offlineMode ? 'var(--status-warning)' : 'var(--text-tertiary)', textAlign: 'center', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {offlineMode ? (
                  <>
                    <AlertCircle size={12} />
                    Hermes API offline. Running in standalone mock mode.
                  </>
                ) : (
                  <>
                    <Hash size={12} />
                    Hermes connection active. Messages are routed through the cognitive adapter.
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
