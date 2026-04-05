'use client';

import { useState, useEffect } from 'react';
import {
  Database, Plus, Trash2, Edit3, X, ChevronDown, ChevronRight, Cpu, Zap,
  Check, RefreshCw, Bot, ArrowRight, Shield, Globe, Key, Sparkles, Star,
} from 'lucide-react';

interface ModelEntry {
  id: string;
  name: string;
  reasoning?: boolean;
  input?: string[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: { input: number; output: number; cacheRead?: number; cacheWrite?: number };
}

interface Provider {
  baseUrl: string;
  apiKey?: string;
  auth?: string;
  api?: string;
  models: ModelEntry[];
}

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  model: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  'google-ai': '#4285F4',
  nvidia: '#76B900',
  moonshot: '#7C3AED',
  anthropic: '#D97706',
  openai: '#10A37F',
  'openai-codex': '#10A37F',
  ollama: '#E34234',
  mistral: '#FF6D00',
  'google-gemini-cli': '#34A853',
  deepseek: '#6366F1',
  together: '#FF4081',
};

const API_TYPES = [
  { value: 'openai-completions', label: 'OpenAI Completions' },
  { value: 'google-generative-ai', label: 'Google Generative AI' },
  { value: 'anthropic', label: 'Anthropic Messages' },
  { value: 'ollama', label: 'Ollama' },
];

export default function ModelsPage() {
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [defaults, setDefaults] = useState<{ primary?: string; fallbacks?: string[] }>({});
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  // Modal states
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddModel, setShowAddModel] = useState<string | null>(null);
  const [editProvider, setEditProvider] = useState<string | null>(null);
  const [editModel, setEditModel] = useState<{ providerId: string; model: ModelEntry } | null>(null);
  const [showAgentMapper, setShowAgentMapper] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetch('/api/models')
      .then(r => r.json())
      .then(d => {
        setProviders(d.providers || {});
        setDefaults(d.defaults || {});
        setAgents(d.agents || []);
        // Auto-expand all providers on first load
        setExpandedProviders(new Set(Object.keys(d.providers || {})));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const apiAction = async (body: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed');
      }
      refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = (id: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allModels = Object.entries(providers).flatMap(([pid, p]) =>
    (p.models || []).map(m => ({ fullId: `${pid}/${m.id}`, label: m.name || m.id, provider: pid }))
  );

  const providerColor = (pid: string) => PROVIDER_COLORS[pid] || 'var(--accent-primary)';

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading model registry…</div>;

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Database size={24} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Model Registry
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            {Object.keys(providers).length} providers · {allModels.length} models · Assign models to agents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAgentMapper(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px',
            cursor: 'pointer',
          }}>
            <Bot size={14} /> Agent Mapping
          </button>
          <button onClick={() => setShowAddProvider(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}>
            <Plus size={14} /> Add Provider
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', flexShrink: 0, marginBottom: '24px' }}>
        {/* Primary Model & Fallbacks */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Star size={16} color="var(--status-warning)" fill="var(--status-warning)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Default Model Chain</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Used by agents without an explicit override</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px', padding: '6px 12px', borderRadius: '99px',
              background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700,
              border: '1px solid var(--accent-primary)',
            }}>
              ★ PRIMARY: {defaults.primary || 'Not set'}
            </span>
            {(defaults.fallbacks || []).map((fb, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRight size={12} color="var(--text-muted)" />
                <span style={{
                  fontSize: '11px', padding: '4px 10px', borderRadius: '99px',
                  background: `${providerColor(fb.split('/')[0])}15`,
                  color: providerColor(fb.split('/')[0]),
                  border: `1px solid ${providerColor(fb.split('/')[0])}30`,
                }}>
                  {fb.split('/').pop()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Token Budgeting Mini Widget */}
        <div className="glass-card-static" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Database size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Token Budgets</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* OpenAI Budget (Mocked Telemetry) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>OpenAI</span>
                <span style={{ color: 'var(--text-primary)' }}>$42.50 / $100.00 Limit</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: '#10A37F' }}></div>
              </div>
            </div>
            {/* Anthropic Budget (Mocked Telemetry) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Anthropic</span>
                <span style={{ color: 'var(--status-error)', fontWeight: 600 }}>$14.20 / $15.00 Limit (94%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: '94%', height: '100%', background: 'var(--status-error)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {Object.entries(providers).map(([pid, provider]) => {
          const isExpanded = expandedProviders.has(pid);
          const color = providerColor(pid);

          return (
            <div key={pid} className="glass-card-static" style={{ overflow: 'hidden' }}>
              {/* Provider Header */}
              <div
                onClick={() => toggleProvider(pid)}
                style={{
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cpu size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {pid.replace(/-/g, ' ')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {provider.baseUrl} · {(provider.models || []).length} models
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditProvider(pid); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Edit provider"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setShowAddModel(pid); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                    title="Add model"
                  >
                    <Plus size={14} />
                  </button>
                  {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Models List */}
              {isExpanded && (provider.models || []).length > 0 && (
                <div style={{ padding: '0' }}>
                  {(provider.models || []).map((model, i) => {
                    const fullId = `${pid}/${model.id}`;
                    const isPrimary = defaults.primary === fullId;
                    const isFallback = (defaults.fallbacks || []).includes(fullId);
                    const assignedAgents = agents.filter(a => a.model === fullId);

                    return (
                      <div key={model.id} style={{
                        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                        borderBottom: i < (provider.models || []).length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: isPrimary ? 'var(--accent-subtle)' : 'transparent',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{model.name || model.id}</span>
                            {model.reasoning && <Sparkles size={12} color="var(--status-warning)" />}
                            {isPrimary && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '99px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 700 }}>PRIMARY</span>}
                            {isFallback && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '99px', background: 'var(--status-warning)', color: '#fff', fontWeight: 700 }}>FALLBACK</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                            {fullId}
                            {model.contextWindow && <span> · {(model.contextWindow / 1000).toFixed(0)}K ctx</span>}
                            {model.maxTokens && <span> · {model.maxTokens} max</span>}
                          </div>
                          {assignedAgents.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              {assignedAgents.map(a => (
                                <span key={a.id} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '99px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                  {a.emoji} {a.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {!isPrimary && (
                            <button
                              onClick={() => apiAction({ action: 'setDefault', primary: fullId })}
                              title="Set as primary"
                              style={{ background: 'none', border: '1px solid var(--border-default)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Star size={10} /> Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => setEditModel({ providerId: pid, model })}
                            title="Edit model"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove model "${model.name || model.id}" from ${pid}?`)) {
                                apiAction({ action: 'removeModel', providerId: pid, modelId: model.id });
                              }
                            }}
                            title="Remove model"
                            style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && (provider.models || []).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No models configured. <button onClick={() => setShowAddModel(pid)} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>Add one →</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && <ProviderModal onClose={() => setShowAddProvider(false)} onSave={(data) => { apiAction({ action: 'addProvider', ...data }); setShowAddProvider(false); }} />}

      {/* Edit Provider Modal */}
      {editProvider && providers[editProvider] && (
        <ProviderModal
          initial={{ id: editProvider, ...providers[editProvider] }}
          onClose={() => setEditProvider(null)}
          onSave={(data) => {
            apiAction({ action: 'updateProvider', id: editProvider, updates: data });
            setEditProvider(null);
          }}
          onDelete={() => {
            if (confirm(`Delete provider "${editProvider}" and all its models?`)) {
              apiAction({ action: 'removeProvider', id: editProvider });
              setEditProvider(null);
            }
          }}
        />
      )}

      {/* Add Model Modal */}
      {showAddModel && (
        <ModelModal
          providerId={showAddModel}
          onClose={() => setShowAddModel(null)}
          onSave={(model) => { apiAction({ action: 'addModel', providerId: showAddModel, model }); setShowAddModel(null); }}
        />
      )}

      {/* Edit Model Modal */}
      {editModel && (
        <ModelModal
          providerId={editModel.providerId}
          initial={editModel.model}
          onClose={() => setEditModel(null)}
          onSave={(updates) => {
            apiAction({ action: 'updateModel', providerId: editModel.providerId, modelId: editModel.model.id, updates });
            setEditModel(null);
          }}
        />
      )}

      {/* Agent-Model Mapper */}
      {showAgentMapper && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowAgentMapper(false)}>
          <div className="glass-card" style={{ width: '550px', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Agent → Model Mapping</span>
              </div>
              <button onClick={() => setShowAgentMapper(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>
                Assign a specific model to each agent. Agents without an override use the primary default ({defaults.primary}).
              </p>
              {agents.map(agent => (
                <div key={agent.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: '22px' }}>{agent.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{agent.id}</div>
                  </div>
                  <select
                    value={agent.model}
                    onChange={e => apiAction({ action: 'setAgentModel', agentId: agent.id, model: e.target.value })}
                    style={{
                      padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px',
                      minWidth: '200px', maxWidth: '260px',
                    }}
                  >
                    <option value="">🔗 Default ({(defaults.primary || '').split('/').pop()})</option>
                    {allModels.map(m => (
                      <option key={m.fullId} value={m.fullId}>{m.label} ({m.provider})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-Modals ────────────────────────────────────────── */

function ProviderModal({ initial, onClose, onSave, onDelete }: {
  initial?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id || '',
    baseUrl: initial?.baseUrl || '',
    apiKey: initial?.apiKey || '',
    auth: initial?.auth || 'api-key',
    api: initial?.api || 'openai-completions',
  });
  const isEdit = !!initial;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div className="glass-card" style={{ width: '480px', maxWidth: '90vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--accent-primary)" />
          {isEdit ? 'Edit Provider' : 'Add New Provider'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Provider ID</label>
            <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} disabled={isEdit} placeholder="e.g. openai, anthropic, mistral"
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', opacity: isEdit ? 0.6 : 1 }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Base URL</label>
            <input value={form.baseUrl} onChange={e => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1"
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>API Key</label>
            <input type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..."
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Auth Type</label>
              <select value={form.auth} onChange={e => setForm({ ...form, auth: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}>
                <option value="api-key">API Key</option>
                <option value="oauth">OAuth</option>
                <option value="none">None</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>API Format</label>
              <select value={form.api} onChange={e => setForm({ ...form, api: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}>
                {API_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div>
            {onDelete && (
              <button onClick={onDelete} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={12} /> Delete Provider
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => onSave(form)} disabled={!form.id || !form.baseUrl} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, opacity: !form.id || !form.baseUrl ? 0.5 : 1 }}>
              {isEdit ? 'Save Changes' : 'Add Provider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelModal({ providerId, initial, onClose, onSave }: {
  providerId: string;
  initial?: ModelEntry;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id || '',
    name: initial?.name || '',
    reasoning: initial?.reasoning || false,
    contextWindow: initial?.contextWindow || 128000,
    maxTokens: initial?.maxTokens || 4096,
    inputText: true,
    inputImage: initial?.input?.includes('image') || false,
  });
  const isEdit = !!initial;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div className="glass-card" style={{ width: '480px', maxWidth: '90vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--status-warning)" />
          {isEdit ? `Edit Model — ${providerId}` : `Add Model to ${providerId}`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Model ID</label>
            <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} disabled={isEdit} placeholder="e.g. gpt-4o, claude-3-opus"
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', opacity: isEdit ? 0.6 : 1 }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Display Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="GPT-4o"
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Context Window</label>
              <input type="number" value={form.contextWindow} onChange={e => setForm({ ...form, contextWindow: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Max Output Tokens</label>
              <input type="number" value={form.maxTokens} onChange={e => setForm({ ...form, maxTokens: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.reasoning} onChange={e => setForm({ ...form, reasoning: e.target.checked })} /> Reasoning Model ✨
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.inputImage} onChange={e => setForm({ ...form, inputImage: e.target.checked })} /> Vision (image input)
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => {
            const input: string[] = ['text'];
            if (form.inputImage) input.push('image');
            onSave({ id: form.id, name: form.name, reasoning: form.reasoning, contextWindow: form.contextWindow, maxTokens: form.maxTokens, input });
          }} disabled={!form.id || !form.name} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, opacity: !form.id || !form.name ? 0.5 : 1 }}>
            {isEdit ? 'Save Changes' : 'Add Model'}
          </button>
        </div>
      </div>
    </div>
  );
}
