'use client';

import { useState, useEffect } from 'react';
import { Server, Network, Plus, Play, Square, Save, X, Trash2, Globe, Lock, Shield, Link2, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface FederationPeer {
  id: string;
  name: string;
  endpoint: string;
  authToken: string;
  capabilities: string[];
  boundAgents: string[];
  status: 'connected' | 'disconnected' | 'pending';
  lastSeen?: string;
}

interface ProtocolsData {
  mcpServers: Record<string, McpServerConfig>;
  network: {
    a2a_rules: Record<string, any>;
    federation?: { peers: FederationPeer[] };
  };
}

interface AgentInfo { id: string; name: string; emoji: string; }

export default function ProtocolsPage() {
  const [data, setData] = useState<ProtocolsData | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mcp' | 'a2a'>('mcp');
  
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpForm, setMcpForm] = useState({ name: '', command: '', args: '', env: '' });

  const [showPeerModal, setShowPeerModal] = useState(false);
  const [peerForm, setPeerForm] = useState({ name: '', endpoint: '', authToken: '', capabilities: '', boundAgents: [] as string[] });
  const [expandedPeer, setExpandedPeer] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/protocols').then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
    ]).then(([protoRes, agentsRes]) => {
      setData(protoRes);
      if (agentsRes.agents) setAgents(agentsRes.agents.map((a: any) => ({ id: a.id, name: a.name, emoji: a.emoji })));
      setLoading(false);
    });
  }, []);

  const saveConfig = async (newData: any) => {
    setSaving(true);
    await fetch('/api/protocols', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    setSaving(false);
    setData(newData);
  };

  const handleAddMcp = () => {
    if (!data || !mcpForm.name || !mcpForm.command) return;
    let parsedArgs: string[] = [];
    try { parsedArgs = JSON.parse(mcpForm.args || '[]'); } catch { parsedArgs = mcpForm.args.split(',').map(s => s.trim()).filter(Boolean); }
    let parsedEnv: Record<string, string> = {};
    try { parsedEnv = JSON.parse(mcpForm.env || '{}'); } catch { /* ignore */ }
    const updatedData = {
      ...data,
      mcpServers: { ...data.mcpServers, [mcpForm.name]: { command: mcpForm.command, args: parsedArgs, env: parsedEnv } }
    };
    saveConfig(updatedData);
    setShowMcpModal(false);
    setMcpForm({ name: '', command: '', args: '', env: '' });
  };

  const handleDeleteMcp = (name: string) => {
    if (!data) return;
    const newMcpServers = { ...data.mcpServers };
    delete newMcpServers[name];
    saveConfig({ ...data, mcpServers: newMcpServers });
  };

  const handleAddPeer = () => {
    if (!data || !peerForm.name || !peerForm.endpoint) return;
    const newPeer: FederationPeer = {
      id: crypto.randomUUID().slice(0, 8),
      name: peerForm.name,
      endpoint: peerForm.endpoint,
      authToken: peerForm.authToken,
      capabilities: peerForm.capabilities.split(',').map(s => s.trim()).filter(Boolean),
      boundAgents: peerForm.boundAgents,
      status: 'pending',
    };
    const peers = [...(data.network?.federation?.peers || []), newPeer];
    saveConfig({ ...data, network: { ...data.network, federation: { peers } } });
    setShowPeerModal(false);
    setPeerForm({ name: '', endpoint: '', authToken: '', capabilities: '', boundAgents: [] });
  };

  const handleDeletePeer = (id: string) => {
    if (!data) return;
    const peers = (data.network?.federation?.peers || []).filter(p => p.id !== id);
    saveConfig({ ...data, network: { ...data.network, federation: { peers } } });
  };

  const toggleBoundAgent = (agentId: string) => {
    setPeerForm(prev => ({
      ...prev,
      boundAgents: prev.boundAgents.includes(agentId)
        ? prev.boundAgents.filter(a => a !== agentId)
        : [...prev.boundAgents, agentId]
    }));
  };

  if (loading || !data) {
    return <div className="page-enter" style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading Protocol Engines...</div>;
  }

  const mcpCount = Object.keys(data.mcpServers || {}).length;
  const peerCount = (data.network?.federation?.peers || []).length;

  return (
    <div className="page-enter" style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Agent Protocols</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            {mcpCount} MCP servers · {peerCount} federation peers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setTab('mcp')} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: tab === 'mcp' ? 'var(--accent-subtle)' : 'transparent',
            color: tab === 'mcp' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: tab === 'mcp' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Server size={16} /> MCP Servers <span className="badge badge-primary" style={{ marginLeft: '4px' }}>{mcpCount}</span>
          </button>
          <button onClick={() => setTab('a2a')} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: tab === 'a2a' ? 'var(--accent-subtle)' : 'transparent',
            color: tab === 'a2a' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: tab === 'a2a' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Globe size={16} /> A2A Federation <span className="badge badge-info" style={{ marginLeft: '4px' }}>{peerCount}</span>
          </button>
        </div>
      </div>

      {/* ─── MCP TAB ─── */}
      {tab === 'mcp' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Registered MCP Connectors</h2>
            <button onClick={() => setShowMcpModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add Server
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
            {mcpCount === 0 ? (
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No MCP servers configured yet.</div>
            ) : (
              Object.entries(data.mcpServers).map(([name, config]) => (
                <div key={name} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                        <Server size={20} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--status-success)', fontFamily: 'var(--font-mono)' }}>● active_bind</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" style={{ color: 'var(--status-success)' }} title="Restart"><Play size={14} /></button>
                      <button className="icon-btn" style={{ color: 'var(--status-error)' }} title="Stop"><Square size={14} /></button>
                      <button onClick={() => handleDeleteMcp(name)} className="icon-btn" style={{ color: 'var(--text-muted)' }} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflowX: 'auto' }}>
                    <div style={{ color: 'var(--accent-primary)', marginBottom: '4px' }}>&gt; {config.command} {config.args?.join(' ')}</div>
                    {config.env && Object.keys(config.env).length > 0 && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>ENV:</span> {Object.keys(config.env).length} keys injected
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── A2A FEDERATION TAB ─── */}
      {tab === 'a2a' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>External Federation Peers</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>Connect remote OpenClaw instances or external agent frameworks to enable cross-environment collaboration.</p>
            </div>
            <button onClick={() => setShowPeerModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add Peer
            </button>
          </div>

          {peerCount === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Globe size={48} color="var(--accent-primary)" style={{ opacity: 0.4, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Federation Peers</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                Add a remote OpenClaw instance to allow your agents to securely delegate tasks, share skills, and collaborate across infrastructure boundaries.
              </p>
              <button onClick={() => setShowPeerModal(true)} style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={14} /> Register First Peer
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data.network?.federation?.peers || []).map(peer => {
                const isExpanded = expandedPeer === peer.id;
                const statusColor = peer.status === 'connected' ? 'var(--status-success)' : peer.status === 'pending' ? 'var(--status-warning)' : 'var(--status-error)';
                return (
                  <div key={peer.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedPeer(isExpanded ? null : peer.id)}
                      style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Globe size={22} color={statusColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{peer.name}</span>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: `${statusColor}18`, color: statusColor, fontWeight: 600, textTransform: 'uppercase' }}>{peer.status}</span>
                        </div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peer.endpoint}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <div>{peer.capabilities.length} capabilities</div>
                          <div>{peer.boundAgents.length} agents bound</div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Allowed Capabilities</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {peer.capabilities.length === 0 ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No capabilities set (unrestricted)</span>
                              ) : peer.capabilities.map(cap => (
                                <span key={cap} style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', borderRadius: '99px', fontWeight: 500 }}>{cap}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bound Local Agents</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {peer.boundAgents.length === 0 ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All agents (default)</span>
                              ) : peer.boundAgents.map(agId => {
                                const ag = agents.find(a => a.id === agId);
                                return (
                                  <span key={agId} style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderRadius: '99px', fontWeight: 500 }}>
                                    {ag ? `${ag.emoji} ${ag.name}` : agId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                            Auth: {peer.authToken ? '••••••••' + peer.authToken.slice(-4) : 'None'}
                          </div>
                          <button onClick={() => handleDeletePeer(peer.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--status-error)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            <Trash2 size={12} /> Remove Peer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add MCP Modal */}
      {showMcpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Add MCP Server</div>
              <button onClick={() => setShowMcpModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Server Name (Identifier)</label>
                <input value={mcpForm.name} onChange={e => setMcpForm({...mcpForm, name: e.target.value})} placeholder="e.g. github-mcp" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Command Line EXecutable</label>
                <input value={mcpForm.command} onChange={e => setMcpForm({...mcpForm, command: e.target.value})} placeholder="e.g. npx, node, python" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Arguments (Comma separated or JSON Array)</label>
                <input value={mcpForm.args} onChange={e => setMcpForm({...mcpForm, args: e.target.value})} placeholder="e.g. -y, @modelcontextprotocol/server-postgres" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Environment Variables (JSON)</label>
                <textarea value={mcpForm.env} onChange={e => setMcpForm({...mcpForm, env: e.target.value})} placeholder='{"GITHUB_TOKEN": "..."}' style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowMcpModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
              <button disabled={!mcpForm.name || !mcpForm.command || saving} onClick={handleAddMcp} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: (!mcpForm.name || !mcpForm.command) ? 'not-allowed' : 'pointer', opacity: (!mcpForm.name || !mcpForm.command) ? 0.5 : 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Save size={14} /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Peer Modal */}
      {showPeerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Register Federation Peer</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Connect a remote OpenClaw instance or agent framework</div>
              </div>
              <button onClick={() => setShowPeerModal(false)} className="icon-btn"><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Peer Name (e.g. "Company B Engineering")</label>
                <input value={peerForm.name} onChange={e => setPeerForm({...peerForm, name: e.target.value})} placeholder="e.g. remote-prod-cluster" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Gateway Endpoint URL</label>
                <input value={peerForm.endpoint} onChange={e => setPeerForm({...peerForm, endpoint: e.target.value})} placeholder="https://openclaw.company-b.com:18789" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Authentication Token (Bearer / API Key)</label>
                <input type="password" value={peerForm.authToken} onChange={e => setPeerForm({...peerForm, authToken: e.target.value})} placeholder="sk-peer-..." style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Allowed Capabilities (comma-separated)</label>
                <input value={peerForm.capabilities} onChange={e => setPeerForm({...peerForm, capabilities: e.target.value})} placeholder="task-delegation, skill-sharing, code-review" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Bind to Local Agents (select which agents can use this peer)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {agents.map(a => (
                    <button key={a.id} type="button" onClick={() => toggleBoundAgent(a.id)} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                      background: peerForm.boundAgents.includes(a.id) ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      border: `1px solid ${peerForm.boundAgents.includes(a.id) ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      color: peerForm.boundAgents.includes(a.id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}>
                      {a.emoji} {a.name}
                    </button>
                  ))}
                  {agents.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No agents found</span>}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>Leave all unselected to allow all agents access.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowPeerModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
              <button disabled={!peerForm.name || !peerForm.endpoint || saving} onClick={handleAddPeer} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: (!peerForm.name || !peerForm.endpoint) ? 'not-allowed' : 'pointer', opacity: (!peerForm.name || !peerForm.endpoint) ? 0.5 : 1, display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600 }}>
                <Globe size={14} /> Register Peer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
