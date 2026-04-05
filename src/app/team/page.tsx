'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Cpu, GitBranch, RefreshCw, Eye, Zap, ChevronDown, X, FileText, MessageSquare, Edit3, Save, Star, ArrowRight } from 'lucide-react';
import { relativeTime, truncate } from '@/lib/parsers';

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  sessionCount: number;
  soulPreview: string | null;
  status: string;
  workspace?: string;
  fallbackChain?: string;
}

interface TeamData {
  agents: AgentData[];
  defaults: {
    model: string;
    fallbacks: string[];
    heartbeat: { every: string };
    workspace: string;
  };
  modelProviders: Array<{ id: string; name: string; provider: string }>;
}

const MODEL_SHORT: Record<string, string> = {
  'moonshot/kimi-k2.5': 'Kimi K2.5',
  'nvidia/moonshotai/kimi-k2.5': 'Kimi K2.5 (NVIDIA)',
  'google-ai/gemini-2.5-flash': 'Gemini Flash',
  'google-ai/gemini-2.5-pro': 'Gemini Pro',
  'anthropic/claude-sonnet-4-5': 'Claude Sonnet',
  'openai-codex:default': 'OpenAI Codex',
};

const PROVIDER_COLORS: Record<string, string> = {
  moonshot: '#7C3AED',
  nvidia: '#76B900',
  'google-ai': '#4285F4',
  anthropic: '#D97706',
  'openai-codex': '#10A37F',
};

const ORG_STRUCTURE = {
  chief: 'main',
  reports: ['cto', 'ralph', 'customer-success'],
};

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const [newAgent, setNewAgent] = useState({ 
    id: '', name: '', emoji: '🤖', role: 'Chief of Staff',
    model: '', fallbackChain: '', manager: 'main',
    workspacePath: '', envVars: '', rateLimit: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  // SOUL viewer state
  const [soulContent, setSoulContent] = useState<string | null>(null);
  const [loadingSoul, setLoadingSoul] = useState(false);
  const [showSoulViewer, setShowSoulViewer] = useState(false);
  // Sessions viewer state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showSessionsViewer, setShowSessionsViewer] = useState(false);

  // Agent Detail Tabs & Editing
  const [activeTab, setActiveTab] = useState<'overview'|'identity'|'persona'|'rules'|'heartbeat'>('overview');
  const [editingAgent, setEditingAgent] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  // Markdown Editor
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [fileIsGlobal, setFileIsGlobal] = useState(false);

  // Markdown Wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardTarget, setWizardTarget] = useState('IDENTITY.md');
  const [wizardPrompt, setWizardPrompt] = useState('');
  const [wizardGenerating, setWizardGenerating] = useState(false);

  const fetchAgents = () => {
    setLoading(true);
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      setEditForm({
        name: selectedAgent.name,
        emoji: selectedAgent.emoji,
        role: selectedAgent.role,
        model: selectedAgent.model,
        fallbackChain: selectedAgent.fallbackChain || '',
      });
      if (activeTab !== 'overview') {
        loadFile(activeTab.toUpperCase() + '.md');
      }
    }
  }, [selectedAgent, activeTab]);

  const loadFile = async (filename: string) => {
    if (!selectedAgent) return;
    setFileLoading(true);
    try {
      const res = await fetch(`/api/agents/files?agentId=${selectedAgent.id}&file=${filename}`);
      if (res.ok) {
        const d = await res.json();
        setFileContent(d.content || '');
        setFileIsGlobal(d.isGlobal || false);
      } else {
        setFileContent('');
      }
    } catch {
      setFileContent('Error loading file');
    } finally {
      setFileLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedAgent || activeTab === 'overview') return;
    setFileSaving(true);
    const filename = activeTab.toUpperCase() + '.md';
    try {
      await fetch('/api/agents/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, file: filename, content: fileContent }),
      });
      setFileIsGlobal(false);
    } catch (err) {
      alert('Failed to save file');
    } finally {
      setFileSaving(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    try {
      const res = await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAgent.id,
          ...editForm,
        }),
      });
      if (res.ok) {
        setEditingAgent(false);
        fetchAgents();
      }
    } catch (err) {
      alert('Failed to update agent');
    }
  };

  const handleGenerateMarkdown = async () => {
    if (!wizardPrompt.trim() || !selectedAgent) return;
    setWizardGenerating(true);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: wizardTarget, prompt: wizardPrompt, agentContext: selectedAgent }),
      });
      const d = await res.json();
      if (d.content) {
        setFileContent(d.content);
        setActiveTab(wizardTarget.replace('.md', '').toLowerCase() as any);
        setShowWizard(false);
      }
    } catch {
      alert('Generation failed');
    } finally {
      setWizardGenerating(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewAgent({ id: '', name: '', emoji: '🤖', role: 'Chief of Staff', model: '', fallbackChain: '', manager: 'main', workspacePath: '', envVars: '', rateLimit: '' });
        setShowAdvanced(false);
        fetchAgents();
      } else {
        const error = await res.json();
        alert('Error creating agent: ' + error.error);
      }
    } catch (err) {
      alert('Network error creating agent');
    } finally {
      setCreating(false);
    }
  };

  const viewSoul = async (agentId: string) => {
    setLoadingSoul(true);
    setShowSoulViewer(true);
    try {
      const res = await fetch(`/api/agents/soul?agentId=${agentId}`);
      if (res.ok) {
        const d = await res.json();
        setSoulContent(d.content || 'No SOUL.md found for this agent.');
      } else {
        setSoulContent('Unable to load SOUL.md — file may not exist.');
      }
    } catch {
      setSoulContent('Error loading SOUL.md');
    } finally {
      setLoadingSoul(false);
    }
  };

  const viewSessions = async (agentId: string) => {
    setLoadingSessions(true);
    setShowSessionsViewer(true);
    try {
      const res = await fetch(`/api/agents/sessions?agentId=${agentId}`);
      if (res.ok) {
        const d = await res.json();
        setSessions(d.sessions || []);
      } else {
        setSessions([]);
      }
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const chief = data?.agents.find(a => a.id === ORG_STRUCTURE.chief) || data?.agents[0];
  const reports = data?.agents.filter(a => a.id !== chief?.id) || [];

  const modelLabel = (model: string) => {
    if (typeof model !== 'string') return 'Unknown';
    return MODEL_SHORT[model] || model.split('/').pop() || model;
  };
  
  const providerColor = (model: string) => {
    if (typeof model !== 'string') return 'var(--accent-primary)';
    const provider = model.split('/')[0];
    return PROVIDER_COLORS[provider] || 'var(--accent-primary)';
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Team
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '6px', margin: '6px 0 0 0' }}>
            {data?.agents.length || 0} agents · {data?.defaults?.heartbeat?.every || '5m'} heartbeat
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'var(--accent-primary)', border: 'none',
              borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'background var(--transition-fast)',
            }}
          >
            Create Agent
          </button>
          <button
            onClick={fetchAgents}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-tertiary)' }}>
          Loading team data…
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
          {/* Left: Org chart + cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Org Chart */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <GitBranch size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Org Chart</span>
              </div>

              {/* Chief */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                {chief && (
                  <button
                    onClick={() => setSelectedAgent(chief)}
                    style={{
                      background: selectedAgent?.id === chief.id ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      border: `1px solid ${selectedAgent?.id === chief.id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-md)', padding: '12px 20px',
                      cursor: 'pointer', transition: 'all var(--transition-fast)',
                      display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{chief.emoji}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{chief.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{chief.role}</div>
                    </div>
                    <div style={{
                      marginLeft: 'auto', fontSize: '10px', fontWeight: 600, padding: '2px 7px',
                      borderRadius: '99px', background: `${providerColor(chief.model)}18`,
                      color: providerColor(chief.model),
                    }}>
                      {modelLabel(chief.model)}
                    </div>
                  </button>
                )}

                {/* Connector lines */}
                <div style={{ width: '2px', height: '20px', background: 'var(--border-default)' }} />
                <div style={{
                  height: '2px', width: `${Math.min(reports.length * 200 + (reports.length - 1) * 16, 700)}px`,
                  background: 'var(--border-default)',
                }} />

                {/* Reports */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '0' }}>
                  {reports.map(agent => {
                    if (!agent) return null;
                    return (
                      <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '2px', height: '20px', background: 'var(--border-default)' }} />
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          style={{
                            background: selectedAgent?.id === agent.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                            border: `1px solid ${selectedAgent?.id === agent.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)', padding: '10px 16px',
                            cursor: 'pointer', transition: 'all var(--transition-fast)',
                            display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{agent.emoji}</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{agent.role}</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agent Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {data?.agents.map(agent => (
                <div
                  key={agent.id}
                  className="glass-card"
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    padding: '20px', cursor: 'pointer',
                    border: selectedAgent?.id === agent.id ? '1px solid var(--accent-primary)' : undefined,
                    background: selectedAgent?.id === agent.id ? 'var(--accent-subtle)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                    }}>
                      {agent.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{agent.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div className="status-dot idle" style={{ background: 'var(--text-muted)', width: '6px', height: '6px' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Idle</span>
                    </div>
                  </div>

                  {/* Model badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Cpu size={11} color="var(--text-muted)" />
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                      background: `${providerColor(agent.model)}15`,
                      color: providerColor(agent.model), fontWeight: 600,
                    }}>
                      {modelLabel(agent.model)}
                    </span>
                  </div>

                  {/* SOUL Preview */}
                  {agent.soulPreview && (
                    <div style={{
                      fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.6',
                      borderTop: '1px solid var(--border-subtle)', paddingTop: '10px',
                      fontStyle: 'italic',
                    }}>
                      &quot;{truncate(agent.soulPreview, 120)}&quot;
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {agent.sessionCount} sessions
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/team/${agent.id}`); }}
                      style={{
                        fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, padding: 0,
                      }}
                    >
                      Deep Dive <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Model Fallback Chain */}
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Zap size={16} color="var(--status-warning)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Model Fallback Chain</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '99px',
                  background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700,
                }}>
                  PRIMARY: {modelLabel(data?.defaults.model || '')}
                </span>
                {data?.defaults.fallbacks.map((fb, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
                    <span style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '99px',
                      background: `${providerColor(fb)}10`, color: providerColor(fb),
                    }}>
                      {modelLabel(fb)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Agent Detail Panel */}
          {selectedAgent && (
            <div className="glass-card-static" style={{ width: '400px', minWidth: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Tab Bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                {(['overview','identity','persona','rules','heartbeat'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    style={{ flex: 1, padding: '12px 0', fontSize: '11px', fontWeight: activeTab === t ? 600 : 500, color: activeTab === t ? 'var(--accent-primary)' : 'var(--text-tertiary)', background: 'transparent', border: 'none', borderBottom: activeTab === t ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {t}
                  </button>
                ))}
              </div>
              
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {activeTab === 'overview' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                          {editingAgent ? <input value={editForm.emoji} onChange={e => setEditForm({...editForm, emoji: e.target.value})} maxLength={2} style={{ width: '40px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '4px', textAlign: 'center', color: 'white' }} /> : selectedAgent.emoji}
                        </div>
                        <div>
                          {editingAgent ? (
                            <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ fontSize: '16px', fontWeight: 600, background: 'var(--bg-input)', border: '1px solid var(--border-default)', padding: '4px 8px', borderRadius: '4px', color: 'white', marginBottom: '4px', width: '100%' }} />
                          ) : (
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAgent.name}</div>
                          )}
                          
                          {editingAgent ? (
                            <input value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ fontSize: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', width: '100%' }} />
                          ) : (
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{selectedAgent.role}</div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => editingAgent ? handleUpdateAgent() : setEditingAgent(true)} style={{ background: editingAgent ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: editingAgent ? 'none' : '1px solid var(--border-default)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: editingAgent ? 'white' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {editingAgent ? <Save size={12} /> : <Edit3 size={12} />} {editingAgent ? 'Save' : 'Edit'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Primary Model</span>
                        {editingAgent ? (
                          <select value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }}>
                            {data?.modelProviders.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        ) : (
                          <span style={{ color: providerColor(selectedAgent.model), fontWeight: 600 }}>{modelLabel(selectedAgent.model)}</span>
                        )}
                      </div>
                      
                      {editingAgent && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>Fallback Model</span>
                          <select value={editForm.fallbackChain} onChange={e => setEditForm({...editForm, fallbackChain: e.target.value})} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }}>
                            <option value="">(None)</option>
                            <option value="same-as-primary">Same as primary</option>
                            {data?.modelProviders.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Sessions</span>
                        <span style={{ color: 'var(--text-primary)' }}>{selectedAgent.sessionCount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Status</span>
                        <span className="badge badge-info">Idle</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Workspace</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 6px', borderRadius: '4px', wordBreak: 'break-all', textAlign: 'right', flex: 1 }}>{selectedAgent.workspace || `~/.openclaw/agents/${selectedAgent.id}/workspace`}</span>
                      </div>
                    </div>

                    {selectedAgent.soulPreview && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>SOUL Preview</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.7', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-primary)', fontStyle: 'italic' }}>
                          &quot;{selectedAgent.soulPreview}&quot;
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => viewSoul(selectedAgent.id)} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FileText size={13} /> View SOUL.md</button>
                      <button onClick={() => viewSessions(selectedAgent.id)} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><MessageSquare size={13} /> Sessions</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeTab.toUpperCase()}.md</div>
                        {fileIsGlobal && <div style={{ fontSize: '10px', color: 'var(--status-warning)', marginTop: '2px' }}>Viewing Global Fallback File</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setWizardTarget(`${activeTab.toUpperCase()}.md`); setShowWizard(true); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}><Star size={11} /> AI Wizard</button>
                        <button onClick={saveFile} disabled={fileSaving} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'white', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}><Save size={11} /> {fileSaving ? 'Saving...' : 'Save'}</button>
                      </div>
                    </div>
                    {fileLoading ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : (
                      <textarea
                        value={fileContent}
                        onChange={e => setFileContent(e.target.value)}
                        placeholder={`Write ${activeTab.toUpperCase()} details here...`}
                        style={{ flex: 1, width: '100%', minHeight: '300px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, resize: 'none', outline: 'none' }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SOUL Viewer Modal */}
      {showSoulViewer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => { setShowSoulViewer(false); setSoulContent(null); }}>
          <div className="glass-card" style={{ width: '700px', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  SOUL.md — {selectedAgent?.name}
                </span>
              </div>
              <button onClick={() => { setShowSoulViewer(false); setSoulContent(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {loadingSoul ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading SOUL.md…</p>
              ) : (
                <pre style={{
                  fontSize: '12px', lineHeight: 1.7, color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  margin: 0, background: 'var(--bg-elevated)', padding: '16px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                }}>
                  {soulContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Viewer Modal */}
      {showSessionsViewer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => { setShowSessionsViewer(false); setSessions([]); }}>
          <div className="glass-card" style={{ width: '700px', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sessions — {selectedAgent?.name}
                </span>
              </div>
              <button onClick={() => { setShowSessionsViewer(false); setSessions([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {loadingSessions ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Loading sessions…</p>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <MessageSquare size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No sessions found</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', margin: '4px 0 0' }}>This agent hasn&apos;t started any conversations yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.map((sess: any, i: number) => (
                    <div key={sess.name || i} style={{
                      padding: '12px 14px', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {sess.name?.replace('.jsonl', '') || `Session ${i + 1}`}
                        </div>
                        {sess.modifiedAt && (
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            Modified: {new Date(sess.modifiedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {sess.size ? `${(sess.size / 1024).toFixed(1)}KB` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: showAdvanced ? '600px' : '400px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'width 0.3s ease' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Team Member</div>
            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Agent ID (e.g. eng-lead)</label>
                <input required value={newAgent.id} onChange={e => setNewAgent({...newAgent, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                  style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Display Name</label>
                <input required value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} 
                  style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>G-STACK Template</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {[
                    { id: 'chief-of-staff', name: 'Chief of Staff', desc: 'Project management & cross-agent routing', icon: '👔' },
                    { id: 'eng-lead', name: 'Eng Manager', desc: 'Code reviews & architecture design', icon: '💻' },
                    { id: 'qa-lead', name: 'QA Lead', desc: 'Test generation & bug hunting', icon: '🔎' },
                    { id: 'designer', name: 'Senior Designer', desc: 'UI/UX layout & component design', icon: '🎨' },
                    { id: 'devops', name: 'DevOps Eng', desc: 'CI/CD, Vercel, & Infrastructure', icon: '⚙️' },
                    { id: 'critic', name: 'Second Opinion', desc: 'Security review & code optimization', icon: '🧠' },
                  ].map(tmpl => (
                    <div key={tmpl.id} onClick={() => setNewAgent({...newAgent, role: tmpl.name, emoji: tmpl.icon})}
                      style={{ padding: '10px', background: newAgent.role === tmpl.name ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: newAgent.role === tmpl.name ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '10px' }}>
                      <div style={{ fontSize: '20px' }}>{tmpl.icon}</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: newAgent.role === tmpl.name ? 'white' : 'var(--text-primary)' }}>{tmpl.name}</div>
                        <div style={{ fontSize: '10px', color: newAgent.role === tmpl.name ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)', marginTop: '2px', lineHeight: 1.3 }}>{tmpl.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Primary Model</label>
                <select value={newAgent.model} onChange={e => setNewAgent({...newAgent, model: e.target.value})}
                  style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', appearance: 'none' }}>
                  <option value="">(Default from Config)</option>
                  {data?.modelProviders.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }} title="Used when the primary model is unavailable, rate-limited, or over budget">Fallback Model</label>
                  <select value={newAgent.fallbackChain} onChange={e => setNewAgent({...newAgent, fallbackChain: e.target.value})}
                    style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', appearance: 'none' }}>
                    <option value="">(None)</option>
                    <option value="same-as-primary">Same as primary</option>
                    {data?.modelProviders.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
                  </select>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manager (Hierarchy)</label>
                  <select value={newAgent.manager} onChange={e => setNewAgent({...newAgent, manager: e.target.value})}
                    style={{ padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', appearance: 'none' }}>
                    <option value="">None</option>
                    {data?.agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  {showAdvanced ? 'Hide Advanced Capabilities' : 'Show Advanced Capabilities...'}
                </button>
              </div>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sandboxed Workspace Path</label>
                    <input value={newAgent.workspacePath} onChange={e => setNewAgent({...newAgent, workspacePath: e.target.value})} placeholder="/absolute/path/to/custom/mount"
                      style={{ padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Leave blank to use default `~/.openclaw/agents/[id]/workspace`</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rate Limit (Max Concurrent Tasks)</label>
                      <input type="number" value={newAgent.rateLimit} onChange={e => setNewAgent({...newAgent, rateLimit: e.target.value})} placeholder="e.g. 4"
                        style={{ padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Scoped Environment Variables (JSON)</label>
                    <textarea value={newAgent.envVars} onChange={e => setNewAgent({...newAgent, envVars: e.target.value})} placeholder='{"GITHUB_TOKEN": "private-key-123"}'
                      style={{ padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minHeight: '60px', resize: 'vertical' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creating}
                  style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Markdown Wizard Modal */}
      {showWizard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '90vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <Star size={18} />
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Markdown Wizard</div>
            </div>
            
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Generating content for <strong>{wizardTarget}</strong> (Target: {selectedAgent?.name})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Instructions / Context</label>
              <textarea
                value={wizardPrompt}
                onChange={e => setWizardPrompt(e.target.value)}
                placeholder="E.g., Make this agent very snarky, short responses, focused on deployment logic..."
                style={{ width: '100%', minHeight: '100px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowWizard(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              <button 
                onClick={handleGenerateMarkdown} 
                disabled={wizardGenerating || !wizardPrompt.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: wizardGenerating || !wizardPrompt.trim() ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, opacity: wizardGenerating || !wizardPrompt.trim() ? 0.6 : 1 }}
              >
                {wizardGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Star size={12} />}
                {wizardGenerating ? 'Running...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
