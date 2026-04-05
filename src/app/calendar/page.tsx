'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, AlertCircle, XCircle, CalendarDays, Zap, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { relativeTime } from '@/lib/parsers';

interface CronJob {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
  };
  payload?: { message?: string };
  state?: {
    lastStatus?: string;
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    consecutiveErrors?: number;
    runCount?: number;
  };
}

interface CronData {
  jobs: CronJob[];
  summary: { total: number; enabled: number; disabled: number; failed: number; ok: number };
}

interface AgentMap {
  [id: string]: { name: string; emoji: string };
}

function scheduleLabel(job: CronJob): string {
  const s = job.schedule;
  if (s.kind === 'cron' && s.expr) {
    const parts = s.expr.split(' ');
    if (parts.length >= 5) {
      const [min, hour, , , dow] = parts;
      const tz = s.tz?.split('/').pop() || '';
      if (hour.startsWith('*/')) return `Every ${hour.slice(2)}h`;
      if (min.startsWith('*/')) return `Every ${min.slice(2)}min`;
      const h = parseInt(hour), m = parseInt(min);
      const period = h >= 12 ? 'PM' : 'AM';
      const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const days = dow === '1-5' ? 'Weekdays' : dow !== '*' ? `Day ${dow}` : 'Daily';
      return `${days} ${dh}:${m.toString().padStart(2, '0')} ${period}${tz ? ` ${tz}` : ''}`;
    }
  }
  if (s.kind === 'every' && s.everyMs) {
    const mins = s.everyMs / 60000;
    if (mins < 60) return `Every ${mins}m`;
    return `Every ${mins / 60}h`;
  }
  return s.kind;
}

function jobRunsOnDay(job: CronJob, date: Date): boolean {
  if (!job.enabled) return false;
  const s = job.schedule;
  if (s.kind === 'every') return true; // runs every X mins/hours
  if (s.kind === 'cron' && s.expr) {
    const parts = s.expr.split(' ');
    if (parts.length >= 5) {
      const dow = parts[4];
      if (dow === '*') return true;
      const dayOfWeek = date.getDay(); // 0(Sun) - 6(Sat)
      if (dow === '1-5') return dayOfWeek >= 1 && dayOfWeek <= 5;
      if (dow === '0,6' || dow === '6,0') return dayOfWeek === 0 || dayOfWeek === 6;
      return parseInt(dow) === dayOfWeek;
    }
  }
  return false;
}

function StatusBadge({ job }: { job: CronJob }) {
  if (!job.enabled) return <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Disabled</span>;
  if ((job.state?.consecutiveErrors ?? 0) > 0) return <span className="badge badge-error">Failing ({job.state?.consecutiveErrors} errors)</span>;
  if (job.state?.lastStatus === 'ok') return <span className="badge badge-success">OK</span>;
  if (job.state?.lastStatus === 'error') return <span className="badge badge-error">Error</span>;
  return <span className="badge badge-info">Pending</span>;
}

export default function CalendarPage() {
  const [data, setData] = useState<CronData | null>(null);
  const [agentMap, setAgentMap] = useState<AgentMap>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'failed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'week'>('week');
  const [selected, setSelected] = useState<CronJob | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/cron').then(r => r.json()),
      fetch('/api/agents').then(r => r.json())
    ]).then(([cronRes, agentsRes]) => {
      setData(cronRes);
      
      const map: AgentMap = {};
      if (agentsRes.agents) {
        agentsRes.agents.forEach((a: any) => {
          map[a.id] = { name: a.name, emoji: a.emoji };
        });
      }
      setAgentMap(map);
      setLoading(false);
    });
  }, []);

  const jobs = (data?.jobs || []).filter(j => {
    if (filter === 'enabled') return j.enabled;
    if (filter === 'failed') return (j.state?.consecutiveErrors ?? 0) > 0 || j.state?.lastStatus === 'error';
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled job?')) return;
    try {
      await fetch(`/api/cron?id=${id}`, { method: 'DELETE' });
      const newData = { ...data! };
      newData.jobs = newData.jobs.filter(j => j.id !== id);
      setData(newData);
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error(e);
      alert('Failed to delete job');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const job = data!.jobs.find(j => j.id === id);
      if (!job) return;
      await fetch('/api/cron', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !job.enabled }),
      });
      const newData = { ...data! };
      newData.jobs = newData.jobs.map(j => j.id === id ? { ...j, enabled: !j.enabled } : j);
      setData(newData);
      if (selected?.id === id) setSelected({ ...selected, enabled: !selected.enabled });
    } catch (e) {
      console.error(e);
      alert('Failed to toggle job');
    }
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Calendar
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '6px 0 0 0' }}>
            {data?.summary.total || 0} scheduled jobs · {data?.summary.enabled || 0} enabled · {data?.summary.failed || 0} failing
          </p>
        </div>
        {/* Summary row */}
        {data && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-success">{data.summary.ok} OK</span>
            {data.summary.failed > 0 && <span className="badge badge-error">{data.summary.failed} FAILED</span>}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'enabled', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)', cursor: 'pointer',
                background: filter === f ? 'var(--accent-subtle)' : 'var(--bg-card)',
                color: filter === f ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: filter === f ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button onClick={() => setViewMode('week')} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: viewMode === 'week' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'week' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: 500 }}>Week</button>
          <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-tertiary)', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: 500 }}>List</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
        {/* Main View Area */}
        <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading…</div>
          ) : viewMode === 'week' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', minWidth: '800px' }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() + i);
                const isToday = i === 0;
                
                const dayJobs = jobs.filter(j => jobRunsOnDay(j, dayDate));
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ 
                      padding: '12px', borderRadius: 'var(--radius-md)', 
                      background: isToday ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      borderTop: `3px solid ${isToday ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: isToday ? 'var(--accent-primary)' : 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', marginTop: '4px' }}>
                        {dayDate.getDate()}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dayJobs.length === 0 ? (
                        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '10px 0' }}>No jobs</div>
                      ) : (
                        dayJobs.map(job => {
                          const agent = agentMap[job.agentId] || { emoji: '🤖', name: job.agentId };
                          const isSelected = selected?.id === job.id;
                          return (
                            <div key={job.id} onClick={() => setSelected(isSelected ? null : job)} style={{
                              padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                              cursor: 'pointer', transition: 'all var(--transition-fast)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '14px' }}>{agent.emoji}</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.name}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggle(job.id); }}
                                  style={{ background: 'none', border: 'none', color: job.enabled ? 'var(--status-success)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  title={job.enabled ? 'Disable' : 'Enable'}
                                >
                                  {job.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  title="Delete Job"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {scheduleLabel(job)}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobs.map(job => {
                const agent = agentMap[job.agentId] || { emoji: '🤖', name: job.agentId };
                const isSelected = selected?.id === job.id;
                return (
                  <div
                    key={job.id}
                    className="glass-card"
                    onClick={() => setSelected(isSelected ? null : job)}
                    style={{
                      padding: '16px', cursor: 'pointer',
                      border: isSelected ? '1px solid var(--accent-primary)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px' }}>{agent.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{job.name}</span>
                          <StatusBadge job={job} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{scheduleLabel(job)}</span>
                          <span style={{ margin: '0 6px', color: 'var(--border-default)' }}>·</span>
                          <span>{agent.name}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {job.state?.lastRunAtMs ? (
                          <>
                            <div>Last: {relativeTime(job.state.lastRunAtMs)}</div>
                            {job.state.runCount != null && <div>{job.state.runCount} runs</div>}
                          </>
                        ) : (
                          <div>Never run</div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                        style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                        title="Delete Job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Payload preview */}
                    {job.payload?.message && (
                      <div style={{
                        marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)',
                        fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', lineHeight: 1.5,
                      }}>
                        "{job.payload.message.slice(0, 120)}{job.payload.message.length > 120 ? '…' : ''}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card-static" style={{
            width: '320px', flexShrink: 0, padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'auto',
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{selected.name}</div>
              <StatusBadge job={selected} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              {[
                { label: 'Agent', value: agentMap[selected.agentId]?.name || selected.agentId },
                { label: 'Schedule', value: scheduleLabel(selected) },
                { label: 'Status', value: selected.enabled ? 'Enabled' : 'Disabled' },
                { label: 'Last run', value: selected.state?.lastRunAtMs ? relativeTime(selected.state.lastRunAtMs) : 'Never' },
                { label: 'Total runs', value: String(selected.state?.runCount ?? 0) },
                { label: 'Errors', value: String(selected.state?.consecutiveErrors ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            {selected.schedule.expr && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Cron Expression</div>
                <code style={{
                  display: 'block', padding: '8px 10px', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {selected.schedule.expr}
                </code>
              </div>
            )}
            {selected.payload?.message && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Trigger Message</div>
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                  padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)',
                  lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto',
                  borderLeft: '2px solid var(--accent-primary)',
                }}>
                  {selected.payload.message}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
