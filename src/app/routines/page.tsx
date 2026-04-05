'use client';

import { useState, useEffect } from 'react';
import { Repeat, Plus, Play, Pause, Trash2, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';

interface RoutineRun {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  spendUsd?: number;
  outputSummary?: string;
}

interface Routine {
  id: string;
  companyId: string;
  name: string;
  templatePrompt: string;
  schedule: { kind: string; expr?: string };
  agentId?: string;
  labels?: string[];
  enabled: boolean;
  createdAt: string;
  recentRuns?: RoutineRun[];
  totalRuns?: number;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const statusColors: Record<string, string> = {
  running: 'var(--status-info)',
  completed: 'var(--status-success)',
  failed: 'var(--status-error)',
  cancelled: 'var(--text-muted)',
};

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', templatePrompt: '', cronExpr: '0 9 * * *', agentId: '', labels: '',
  });

  const fetchRoutines = () => {
    fetch('/api/routines')
      .then((r) => r.json())
      .then((d) => { setRoutines(d.routines || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRoutines(); }, []);

  const handleCreate = async () => {
    await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        templatePrompt: form.templatePrompt,
        schedule: { kind: 'cron', expr: form.cronExpr },
        agentId: form.agentId || undefined,
        labels: form.labels.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    setForm({ name: '', templatePrompt: '', cronExpr: '0 9 * * *', agentId: '', labels: '' });
    setShowCreate(false);
    fetchRoutines();
  };

  const toggleEnabled = async (routine: Routine) => {
    await fetch('/api/routines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: routine.id, enabled: !routine.enabled }),
    });
    fetchRoutines();
  };

  const deleteRoutine = async (id: string) => {
    if (!confirm('Delete this routine?')) return;
    await fetch(`/api/routines?id=${id}`, { method: 'DELETE' });
    fetchRoutines();
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Routines</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '6px 0 0 0' }}>
            Tracked recurring agent executions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New Routine
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Create Routine
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Routine name" style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
            <textarea value={form.templatePrompt} onChange={(e) => setForm({ ...form, templatePrompt: e.target.value })} placeholder="Template prompt — what should the agent do each run?" rows={4} style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input value={form.cronExpr} onChange={(e) => setForm({ ...form, cronExpr: e.target.value })} placeholder="Cron expression (e.g. 0 9 * * *)" style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
              <input value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} placeholder="Agent ID (optional)" style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
            </div>
            <input value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} placeholder="Labels (comma-separated)" style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCreate} disabled={!form.name || !form.templatePrompt} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: form.name && form.templatePrompt ? 1 : 0.5 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Routine list */}
      {loading ? (
        <p style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
      ) : routines.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Repeat size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No routines configured</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', margin: '4px 0 0' }}>
            Create a routine to schedule recurring agent work with tracked runs
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {routines.map((routine) => {
            const isExpanded = expandedId === routine.id;
            return (
              <div key={routine.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: routine.enabled ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Repeat size={18} style={{ color: routine.enabled ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{routine.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {routine.schedule.expr || 'manual'}
                      </span>
                      <span>·</span>
                      <span>{routine.totalRuns || 0} runs</span>
                      {routine.labels && routine.labels.length > 0 && (
                        <>
                          <span>·</span>
                          {routine.labels.map((l) => (
                            <span key={l} style={{ background: 'var(--bg-elevated)', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>{l}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => toggleEnabled(routine)} title={routine.enabled ? 'Pause' : 'Resume'} style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: routine.enabled ? 'var(--status-success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {routine.enabled ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => deleteRoutine(routine.id)} title="Delete" style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : routine.id)} style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                      <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms' }} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt Template</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '14px' }}>
                      {routine.templatePrompt || '(empty)'}
                    </div>

                    {routine.recentRuns && routine.recentRuns.length > 0 && (
                      <>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Runs</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {routine.recentRuns.map((run) => (
                            <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[run.status] || 'var(--text-muted)' }} />
                              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{run.status}</span>
                              {run.spendUsd !== undefined && <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>${run.spendUsd.toFixed(4)}</span>}
                              <span style={{ color: 'var(--text-muted)' }}>{relativeTime(run.startedAt)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
