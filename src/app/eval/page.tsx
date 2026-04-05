'use client';

import { useState, useEffect } from 'react';
import { BarChart3, ThumbsUp, ThumbsDown, TrendingUp, Tag, Bot, MessageSquare, AlertTriangle } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  targetKind: string;
  targetId: string;
  agentId?: string;
  rating: 'up' | 'down';
  note?: string;
  tags?: string[];
  repeated?: boolean;
  createdAt: string;
}

interface Analytics {
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  repeated: number;
  successRate: number;
  topTags: { tag: string; count: number }[];
  agentPerformance: { agentId: string; successRate: number; totalReviews: number }[];
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function EvalPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'feed' | 'agents'>('overview');

  useEffect(() => {
    fetch('/api/eval')
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setAnalytics(d.analytics || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Eval</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '6px 0 0 0' }}>
          Performance analytics and feedback loop
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {(['overview', 'feed', 'agents'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', background: tab === t ? 'var(--accent-subtle)' : 'var(--bg-card)',
              border: '1px solid', borderColor: tab === t ? 'var(--accent-primary)' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              color: tab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
      ) : !analytics ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <BarChart3 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No feedback data yet</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', margin: '4px 0 0' }}>
            Submit feedback on completed tasks and routine runs to build performance insights
          </p>
        </div>
      ) : (
        <>
          {/* Overview tab */}
          {tab === 'overview' && (
            <div>
              {/* Metric cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Success Rate', value: `${analytics.successRate}%`, icon: TrendingUp, color: analytics.successRate >= 70 ? 'var(--status-success)' : 'var(--status-warning)' },
                  { label: 'Thumbs Up', value: String(analytics.thumbsUp), icon: ThumbsUp, color: 'var(--status-success)' },
                  { label: 'Thumbs Down', value: String(analytics.thumbsDown), icon: ThumbsDown, color: 'var(--status-error)' },
                  { label: 'Repeated Issues', value: String(analytics.repeated), icon: AlertTriangle, color: analytics.repeated > 0 ? 'var(--status-warning)' : 'var(--text-muted)' },
                ].map((m) => (
                  <div key={m.label} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <m.icon size={16} style={{ color: m.color }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Top Tags */}
              {analytics.topTags.length > 0 && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} style={{ color: 'var(--accent-primary)' }} /> Common Feedback Themes
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analytics.topTags.map(({ tag, count }) => (
                      <div key={tag} style={{
                        padding: '6px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                        fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {tag}
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-subtle)', padding: '1px 5px', borderRadius: '3px' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feed tab */}
          {tab === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No feedback entries</p>
                </div>
              ) : entries.map((entry) => (
                <div key={entry.id} className="glass-card" style={{ padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                    background: entry.rating === 'up' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {entry.rating === 'up'
                      ? <ThumbsUp size={13} style={{ color: 'var(--status-success)' }} />
                      : <ThumbsDown size={13} style={{ color: 'var(--status-error)' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {entry.targetKind.replace('-', ' ')} · {entry.targetId.slice(0, 12)}…
                    </div>
                    {entry.note && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>{entry.note}</p>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {entry.tags?.map((t) => (
                        <span key={t} style={{ fontSize: '10px', padding: '1px 5px', background: 'var(--bg-elevated)', borderRadius: '3px', color: 'var(--text-tertiary)' }}>{t}</span>
                      ))}
                      {entry.repeated && <span style={{ fontSize: '10px', padding: '1px 5px', background: 'var(--status-warning-bg)', borderRadius: '3px', color: 'var(--status-warning)', fontWeight: 700 }}>REPEATED</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{relativeTime(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Agents tab */}
          {tab === 'agents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analytics.agentPerformance.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No agent performance data</p>
                </div>
              ) : analytics.agentPerformance.map((agent) => (
                <div key={agent.agentId} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={18} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.agentId}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{agent.totalReviews} reviews</div>
                  </div>
                  {/* Success bar */}
                  <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: agent.successRate >= 70 ? 'var(--status-success)' : 'var(--status-warning)', textAlign: 'right' }}>
                      {agent.successRate}%
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, width: `${agent.successRate}%`,
                        background: agent.successRate >= 70 ? 'var(--status-success)' : 'var(--status-warning)',
                        transition: 'width 300ms ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
