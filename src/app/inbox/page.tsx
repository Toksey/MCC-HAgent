'use client';

import { useState, useEffect } from 'react';
import { Inbox as InboxIcon, CheckCircle2, XCircle, Eye, Bot, AlertTriangle, MessageSquare, Clock } from 'lucide-react';

interface InboxItem {
  id: string;
  companyId: string;
  kind: 'hire-request' | 'approval' | 'alert' | 'feedback' | 'system';
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  origin: 'human' | 'agent' | 'system';
  originAgentId?: string;
  createdAt: string;
  resolvedAt?: string;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const kindStyles: Record<string, { icon: any; color: string }> = {
  'hire-request': { icon: Bot, color: 'var(--status-info)' },
  'approval': { icon: CheckCircle2, color: 'var(--status-success)' },
  'alert': { icon: AlertTriangle, color: 'var(--status-warning)' },
  'feedback': { icon: MessageSquare, color: 'var(--accent-primary)' },
  'system': { icon: Clock, color: 'var(--text-tertiary)' },
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = () => {
    fetch('/api/inbox')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setSummary(d.summary || { total: 0, pending: 0, approved: 0, rejected: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'dismiss') => {
    await fetch('/api/inbox', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    fetchData();
  };

  const filtered = items.filter((item) => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'resolved') return item.status !== 'pending';
    return true;
  });

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Inbox</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '6px 0 0 0' }}>
          Approvals, hire requests, and system notifications
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'All', value: summary.total, key: 'all' as const },
          { label: 'Pending', value: summary.pending, key: 'pending' as const },
          { label: 'Resolved', value: summary.approved + summary.rejected, key: 'resolved' as const },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px', background: filter === f.key ? 'var(--accent-subtle)' : 'var(--bg-card)',
              border: '1px solid', borderColor: filter === f.key ? 'var(--accent-primary)' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              color: filter === f.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
              display: 'flex', gap: '6px', alignItems: 'center',
            }}
          >
            {f.label} <span style={{ fontVariantNumeric: 'tabular-nums' }}>{f.value}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <InboxIcon size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {filter === 'pending' ? 'No pending items' : 'Inbox is empty'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => {
            const kindStyle = kindStyles[item.kind] || kindStyles.system;
            const KindIcon = kindStyle.icon;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="glass-card"
                style={{ padding: '16px', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <KindIcon size={16} style={{ color: kindStyle.color }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      <span
                        className={`badge ${item.status === 'pending' ? 'badge-warning' : item.status === 'approved' ? 'badge-success' : 'badge-error'}`}
                        style={{ fontSize: '9px' }}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span>{item.kind.replace('-', ' ')}</span>
                      <span>·</span>
                      <span>{item.origin}</span>
                      <span>·</span>
                      <span>{relativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                      {item.body}
                    </p>
                    {item.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'approve'); }}
                          style={{
                            flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: 'var(--status-success-bg)', border: '1px solid var(--status-success)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--status-success)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'reject'); }}
                          style={{
                            flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            background: 'var(--status-error-bg)', border: '1px solid var(--status-error)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--status-error)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'dismiss'); }}
                          style={{
                            padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px',
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
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
