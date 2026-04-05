'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Bot, Brain, Target, Zap, Shield, Activity, Clock, ArrowLeft,
  Play, Pause, StepForward, RefreshCw, ChevronRight, Plus,
  MemoryStick, Cpu, Globe, Lock, TrendingUp, AlertTriangle,
  CheckCircle, Circle, Loader, Edit3, Save, X, Trash2,
} from 'lucide-react';
import type { HermesAgent, MemoryEntry, Goal, HermesSkill, TelemetryState, CognitiveAction } from '@/lib/hermes';
import { AgentHealthCard } from '@/components/telemetry/AgentHealthCard';
import { CognitiveTimeline } from '@/components/telemetry/CognitiveTimeline';

// ── Types ───────────────────────────────────────────────────────

type PanelTab = 'overview' | 'memory' | 'goals' | 'skills' | 'loop' | 'policy';

interface AgentPageData {
  agent: HermesAgent;
  state: TelemetryState;
  memories: MemoryEntry[];
  recentActions: CognitiveAction[];
}

// ── Helpers ─────────────────────────────────────────────────────

const LOOP_PHASE_COLORS: Record<string, string> = {
  idle:       'var(--text-muted)',
  observing:  '#60a5fa',
  thinking:   '#a78bfa',
  acting:     '#34d399',
  paused:     'var(--status-warning)',
  error:      'var(--status-error)',
};

const LOOP_PHASE_ICONS: Record<string, React.ReactNode> = {
  idle:       <Circle size={12} />,
  observing:  <Globe size={12} />,
  thinking:   <Brain size={12} />,
  acting:     <Zap size={12} />,
  paused:     <Pause size={12} />,
  error:      <AlertTriangle size={12} />,
};

const STATUS_DOT: Record<string, string> = {
  online:  'var(--status-success)',
  working: 'var(--status-success)',
  paused:  'var(--status-warning)',
  error:   'var(--status-error)',
  offline: 'var(--text-muted)',
  idle:    'var(--text-muted)',
};

const RISK_COLOR: Record<string, string> = {
  low:      '#34d399',
  medium:   '#fbbf24',
  high:     '#f97316',
  critical: '#ef4444',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Sub-components ───────────────────────────────────────────────



function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      {action}
    </div>
  );
}

// ── Overview Tab ────────────────────────────────────────────────

function OverviewTab({ agent, state, recentActions }: { agent: HermesAgent; state: TelemetryState; recentActions: CognitiveAction[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. New Agent Health Card */}
      <AgentHealthCard agent={agent} state={state} />

      {/* Goals Summary */}
      <div className="glass-card-static" style={{ padding: '20px' }}>
        <SectionHeader title="Active Goals" action={
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{state.activeGoals} active</span>
        } />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {agent.goals.slice(0, 4).map(goal => (
            <div key={goal.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: goal.status === 'active' ? 'var(--status-success)' :
                  goal.status === 'completed' ? '#60a5fa' :
                  goal.status === 'failed' ? 'var(--status-error)' : 'var(--text-muted)',
              }} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{goal.title}</span>
              {/* Progress bar */}
              <div style={{ width: 60, height: 4, background: 'var(--bg-card)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${goal.progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>{goal.progress}%</span>
            </div>
          ))}
          {agent.goals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No goals assigned — use the Goals tab to add one
            </div>
          )}
        </div>
      </div>

      {/* 2. New Cognitive Timeline */}
      <CognitiveTimeline actions={recentActions} />
      
    </div>
  );
}

// ── Memory Tab ──────────────────────────────────────────────────

function MemoryTab({ agentId, memories: initial }: { agentId: string; memories: MemoryEntry[] }) {
  const [memories, setMemories] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'episodic' | 'semantic' | 'procedural' | 'reflection'>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'episodic' | 'semantic' | 'procedural' | 'reflection'>('episodic');
  const [saving, setSaving] = useState(false);

  const filtered = memories.filter(m => {
    const matchesFilter = filter === 'all' || m.type === filter;
    const matchesSearch = !search || m.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, content: newContent, type: newType }),
      });
      if (res.ok) {
        const entry = await res.json();
        setMemories(prev => [entry, ...prev]);
        setNewContent('');
        setAdding(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/memories?id=${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const TYPE_COLORS: Record<string, string> = {
    episodic: '#60a5fa', semantic: '#a78bfa', procedural: '#34d399', reflection: '#fbbf24',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search memories…"
          style={{
            flex: 1, minWidth: 180, padding: '8px 12px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
          }}
        />
        {(['all', 'episodic', 'semantic', 'procedural', 'reflection'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '6px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
            background: filter === t ? (TYPE_COLORS[t] || 'var(--accent-primary)') : 'var(--bg-elevated)',
            color: filter === t ? '#000' : 'var(--text-muted)',
            border: `1px solid ${filter === t ? (TYPE_COLORS[t] || 'var(--accent-primary)') : 'var(--border-subtle)'}`,
            cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
          }}>
            {t}
          </button>
        ))}
        <button onClick={() => setAdding(true)} style={{
          padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
          background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Add Memory Form */}
      {adding && (
        <div className="glass-card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select value={newType} onChange={e => setNewType(e.target.value as typeof newType)} style={{
            padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px',
          }}>
            {(['episodic', 'semantic', 'procedural', 'reflection'] as const).map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Memory content…"
            rows={3}
            style={{
              padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving} style={{ padding: '6px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Store Memory'}
            </button>
          </div>
        </div>
      )}

      {/* Memory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            <MemoryStick size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
            No memories match your filter
          </div>
        ) : filtered.map(m => (
          <div key={m.id} style={{
            padding: '12px 14px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
            display: 'flex', gap: '12px',
          }}>
            <div style={{
              width: 3, borderRadius: 99, flexShrink: 0,
              background: TYPE_COLORS[m.type] || 'var(--accent-primary)',
              alignSelf: 'stretch',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: TYPE_COLORS[m.type],
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{m.type}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{relativeTime(m.updatedAt)}</span>
                  <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.content}</p>
              {m.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {m.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '99px',
                      background: 'var(--bg-card)', color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}>{tag}</span>
                  ))}
                </div>
              )}
              {/* Relevance bar */}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Relevance</span>
                <div style={{ flex: 1, height: 3, background: 'var(--bg-card)', borderRadius: 99 }}>
                  <div style={{ width: `${m.relevance * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: 30 }}>{(m.relevance * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Goals Tab ───────────────────────────────────────────────────

function GoalsTab({ agentId, goals: initial }: { agentId: string; goals: Goal[] }) {
  const [goals, setGoals] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Goal['priority']>('normal');
  const [saving, setSaving] = useState(false);

  const PRIORITY_COLOR: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', normal: '#60a5fa', low: 'var(--text-muted)',
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, title: newTitle, description: newDesc, priority: newPriority }),
      });
      if (res.ok) {
        const goal = await res.json();
        setGoals(prev => [goal, ...prev]);
        setNewTitle(''); setNewDesc(''); setAdding(false);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const STATUS_ICON: Record<string, React.ReactNode> = {
    pending:    <Circle size={13} color="var(--text-muted)" />,
    active:     <Loader size={13} color="#60a5fa" className="animate-spin" />,
    completed:  <CheckCircle size={13} color="#34d399" />,
    failed:     <AlertTriangle size={13} color="var(--status-error)" />,
    decomposed: <TrendingUp size={13} color="#a78bfa" />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setAdding(true)} style={{
          padding: '7px 14px', background: 'var(--accent-primary)', border: 'none',
          borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <Plus size={13} /> New Goal
        </button>
      </div>

      {adding && (
        <div className="glass-card-static" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title…"
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as Goal['priority'])}
              style={{ padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}>
              {(['critical', 'high', 'normal', 'low'] as const).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAdding(false)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{ padding: '6px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Creating…' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Target size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
            No goals yet — assign this agent a mission
          </div>
        ) : goals.map(goal => (
          <div key={goal.id} style={{
            padding: '14px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ marginTop: 2 }}>{STATUS_ICON[goal.status] || <Circle size={13} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                      background: `${PRIORITY_COLOR[goal.priority]}20`, color: PRIORITY_COLOR[goal.priority],
                    }}>{goal.priority.toUpperCase()}</span>
                    <button onClick={() => handleDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {goal.description && (
                  <p style={{ margin: '4px 0 8px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{goal.description}</p>
                )}
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-card)', borderRadius: 99 }}>
                    <div style={{ width: `${goal.progress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: 32 }}>{goal.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skills Tab ──────────────────────────────────────────────────

function SkillsTab({ agentSkills }: { agentSkills: string[] }) {
  const [skills, setSkills] = useState<HermesSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ skills: HermesSkill[] }>('/api/skills').then(d => {
      if (d) setSkills(d.skills);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading skills…</div>;

  const agentSkillSet = new Set(agentSkills);
  const enabled = skills.filter(s => agentSkillSet.has(s.id));
  const available = skills.filter(s => !agentSkillSet.has(s.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Enabled */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Enabled ({enabled.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {enabled.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>No skills enabled for this agent</div>
          ) : enabled.map(skill => (
            <SkillCard key={skill.id} skill={skill} enabled />
          ))}
        </div>
      </div>

      {/* Available */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Available ({available.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {available.map(skill => (
            <SkillCard key={skill.id} skill={skill} enabled={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillCard({ skill, enabled }: { skill: HermesSkill; enabled: boolean }) {
  return (
    <div style={{
      padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
      border: `1px solid ${enabled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
      opacity: enabled ? 1 : 0.7, display: 'flex', gap: '12px', alignItems: 'center',
    }}>
      <Zap size={16} color={enabled ? 'var(--accent-primary)' : 'var(--text-muted)'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{skill.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{skill.description}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
          background: `${RISK_COLOR[skill.riskLevel]}20`, color: RISK_COLOR[skill.riskLevel],
        }}>{skill.riskLevel.toUpperCase()}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{skill.executionCount}×</span>
      </div>
    </div>
  );
}

// ── Policy Tab───────────────────────────────────────────────────

function PolicyTab({ agent }: { agent: HermesAgent }) {
  const AUTONOMY_DESC: Record<string, { label: string; desc: string; color: string }> = {
    conservative: { label: 'Conservative', desc: 'Requires approval for all consequential actions. Maximum oversight.', color: '#34d399' },
    balanced:     { label: 'Balanced', desc: 'Auto-approves low-risk actions. Queues high-risk items for review.', color: '#60a5fa' },
    autonomous:   { label: 'Autonomous', desc: 'Full self-direction. Agent manages its own loop and goal decomposition.', color: '#a78bfa' },
  };

  const current = AUTONOMY_DESC[agent.autonomyLevel] || AUTONOMY_DESC.balanced;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Autonomy Level */}
      <div className="glass-card-static" style={{ padding: '20px' }}>
        <SectionHeader title="Autonomy Level" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(['conservative', 'balanced', 'autonomous'] as const).map(level => {
            const info = AUTONOMY_DESC[level];
            const isActive = agent.autonomyLevel === level;
            return (
              <div key={level} style={{
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${isActive ? info.color : 'var(--border-subtle)'}`,
                background: isActive ? `${info.color}10` : 'var(--bg-elevated)',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', marginTop: 3, flexShrink: 0,
                  background: isActive ? info.color : 'var(--border-default)',
                }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? info.color : 'var(--text-secondary)' }}>{info.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 }}>{info.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security constraints */}
      <div className="glass-card-static" style={{ padding: '20px' }}>
        <SectionHeader title="Security Constraints" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Require approval for deploys', active: agent.autonomyLevel === 'conservative' },
            { label: 'Budget hard cap enforcement', active: true },
            { label: 'MCP tool permission gating', active: true },
            { label: 'Memory write journaling', active: true },
            { label: 'Autonomous agent spawning', active: agent.autonomyLevel === 'autonomous' },
          ].map(({ label, active }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={13} color={active ? '#34d399' : 'var(--text-muted)'} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: active ? '#34d39920' : 'var(--bg-card)', color: active ? '#34d399' : 'var(--text-muted)',
              }}>{active ? 'ON' : 'OFF'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [data, setData] = useState<AgentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [loopControlling, setLoopControlling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [agentRes, stateRes, memoriesRes, actionsRes] = await Promise.all([
      apiFetch<{ agents: HermesAgent[] }>('/api/agents'),
      apiFetch<{ sessions: Array<{ agentId: string; loopPhase: string; uptimeSeconds: number; errorRate: number; memoryCount: number; activeGoals: number; latencyMs: number }> }>('/api/sessions'),
      apiFetch<{ memories: MemoryEntry[] }>(`/api/memories?agentId=${agentId}`),
      apiFetch<{ sessions: CognitiveAction[] }>(`/api/agents/sessions?agentId=${agentId}`),
    ]);

    const agent = agentRes?.agents.find(a => a.id === agentId);
    const stateData = stateRes?.sessions.find(s => s.agentId === agentId);

    if (!agent) { setLoading(false); return; }

    setData({
      agent,
      state: stateData ? {
        agentId,
        loopPhase: stateData.loopPhase as TelemetryState['loopPhase'],
        loopFrequencyMs: 5000,
        latencyMs: stateData.latencyMs,
        errorRate: stateData.errorRate,
        uptimeSeconds: stateData.uptimeSeconds,
        memoryCount: stateData.memoryCount,
        activeGoals: stateData.activeGoals,
        skillUsage: {},
      } : {
        agentId, loopPhase: 'idle', loopFrequencyMs: 5000,
        latencyMs: 0, errorRate: 0, uptimeSeconds: 0, memoryCount: 0, activeGoals: 0, skillUsage: {},
      },
      memories: memoriesRes?.memories || [],
      recentActions: actionsRes?.sessions || [],
    });
    setLoading(false);
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const handleLoopControl = async (action: 'pause' | 'resume' | 'step') => {
    setLoopControlling(true);
    try {
      await fetch(`/api/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, loopAction: action }),
      });
      await load();
    } finally { setLoopControlling(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader size={20} className="animate-spin" />
        <span>Loading agent data…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
        <Bot size={40} />
        <div>Agent <code>{agentId}</code> not found.</div>
        <button onClick={() => router.back()} style={{ padding: '8px 16px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>← Go Back</button>
      </div>
    );
  }

  const { agent, state, memories, recentActions } = data;

  const TABS: Array<{ id: PanelTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview',  icon: <Activity size={14} /> },
    { id: 'memory',   label: `Memory (${memories.length})`, icon: <Brain size={14} /> },
    { id: 'goals',    label: `Goals (${agent.goals.length})`, icon: <Target size={14} /> },
    { id: 'skills',   label: 'Skills',    icon: <Zap size={14} /> },
    { id: 'policy',   label: 'Policy',    icon: <Shield size={14} /> },
  ];

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ─ Header ──────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginBottom: '24px' }}>
        {/* Back nav */}
        <button onClick={() => router.push('/team')} style={{
          display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '16px',
        }}>
          <ArrowLeft size={13} /> Team Roster
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          {/* Identity block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '30px',
              border: `2px solid ${STATUS_DOT[agent.status] || 'var(--border-default)'}`,
            }}>
              {agent.emoji}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {agent.name}
                </h1>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px',
                  borderRadius: '99px', background: `${LOOP_PHASE_COLORS[state.loopPhase]}20`,
                  border: `1px solid ${LOOP_PHASE_COLORS[state.loopPhase]}40`,
                }}>
                  <div style={{ color: LOOP_PHASE_COLORS[state.loopPhase] }}>{LOOP_PHASE_ICONS[state.loopPhase]}</div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: LOOP_PHASE_COLORS[state.loopPhase], textTransform: 'capitalize' }}>
                    {state.loopPhase}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {agent.role} · <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{agent.model}</span>
              </div>
            </div>
          </div>

          {/* Loop Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {state.loopPhase === 'paused' || state.loopPhase === 'idle' ? (
              <button onClick={() => handleLoopControl('resume')} disabled={loopControlling}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#34d399', border: 'none', borderRadius: 'var(--radius-md)', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                <Play size={13} /> Resume Loop
              </button>
            ) : (
              <button onClick={() => handleLoopControl('pause')} disabled={loopControlling}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <Pause size={13} /> Pause
              </button>
            )}
            <button onClick={() => handleLoopControl('step')} disabled={loopControlling}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
              <StepForward size={13} /> Step
            </button>
            <button onClick={load} style={{
              padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
            }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─ Tabs ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0, marginBottom: '24px', gap: '0',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 500,
            color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─ Tab Content ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {activeTab === 'overview' && <OverviewTab agent={agent} state={state} recentActions={recentActions} />}
        {activeTab === 'memory'   && <MemoryTab agentId={agentId} memories={memories} />}
        {activeTab === 'goals'    && <GoalsTab agentId={agentId} goals={agent.goals} />}
        {activeTab === 'skills'   && <SkillsTab agentSkills={agent.skills} />}
        {activeTab === 'policy'   && <PolicyTab agent={agent} />}
      </div>
    </div>
  );
}
