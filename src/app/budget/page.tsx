'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Edit3, Save, X, Zap, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AgentSpend {
  agentId: string;
  spend: number;
}

interface BudgetData {
  budget: {
    companyId: string;
    monthKey: string;
    hardCapUsd: number;
    softCapUsd: number;
    currentSpendUsd: number;
    autoApproveThresholdUsd: number;
    alertTriggered: boolean;
    agentSpend: Record<string, number>;
  };
  utilization: number;
  topSpenders: AgentSpend[];
  alertTriggered: boolean;
  overCap: boolean;
  systemStats: {
    totalSkillExecutions: number;
    averageLoopLatencyMs: number;
  };
}

function SpendGauge({ pct, overCap, alertTriggered }: { pct: number; overCap: boolean; alertTriggered: boolean }) {
  const clamped = Math.min(pct, 100);
  const color = overCap
    ? 'var(--status-error)'
    : alertTriggered
    ? 'var(--status-warning)'
    : 'var(--accent-primary)';

  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (clamped / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={90} cy={90} r={r} fill="none" stroke="var(--border-default)" strokeWidth={14} />
        <circle
          cx={90} cy={90} r={r} fill="none"
          stroke={color} strokeWidth={14}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
          {clamped}%
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>utilization</div>
      </div>
    </div>
  );
}

interface EditCapProps {
  label: string;
  value: number;
  onSave: (v: number) => void;
}

function EditableCap({ label, value, onSave }: EditCapProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onSave(parseFloat(draft) || value); setEditing(false); }
              if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
            }}
            style={{
              width: '90px', padding: '4px 8px', background: 'var(--bg-input)',
              border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, outline: 'none',
            }}
          />
          <button onClick={() => { onSave(parseFloat(draft) || value); setEditing(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-success)', padding: '2px' }}>
            <Save size={14} />
          </button>
          <button onClick={() => { setDraft(String(value)); setEditing(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${value.toFixed(2)}
          </span>
          <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <Edit3 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateCap = async (field: 'hardCapUsd' | 'softCapUsd', value: number) => {
    if (!data) return;
    setSaving(true);
    const res = await fetch('/api/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = await res.json();
    if (updated.budget) {
      setData(prev => prev ? { ...prev, budget: updated.budget } : prev);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <RefreshCw size={24} className="animate-spin" color="var(--accent-primary)" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-enter" style={{ padding: '32px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Failed to load budget data.
      </div>
    );
  }

  const { budget, utilization, topSpenders, alertTriggered, overCap, systemStats } = data;

  const chartData = topSpenders.map(s => ({
    name: s.agentId.replace('agent_', '').replace(/^\w/, c => c.toUpperCase()),
    spend: parseFloat(s.spend.toFixed(2)),
  }));

  const MAX_CHART = Math.max(...chartData.map(d => d.spend), 1);

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <DollarSign size={24} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Budget & Token Usage
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            {budget.monthKey} · {budget.companyId}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
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

      {/* Alert Banner */}
      {(alertTriggered || overCap) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', flexShrink: 0,
          background: overCap ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${overCap ? 'var(--status-error)' : 'var(--status-warning)'}`,
          borderRadius: 'var(--radius-md)',
          color: overCap ? 'var(--status-error)' : 'var(--status-warning)',
        }}>
          <AlertTriangle size={18} />
          <div>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              {overCap ? 'Hard Cap Exceeded' : 'Soft Cap Alert'}
            </span>
            <span style={{ fontSize: '13px', marginLeft: '8px' }}>
              {overCap
                ? `Spending ($${budget.currentSpendUsd.toFixed(2)}) has exceeded the hard cap ($${budget.hardCapUsd.toFixed(2)}). Agent executions may be blocked.`
                : `Spending ($${budget.currentSpendUsd.toFixed(2)}) has crossed the soft cap ($${budget.softCapUsd.toFixed(2)}). Review top spenders.`
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', overflow: 'hidden' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Gauge card */}
          <div className="glass-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
            <SpendGauge pct={utilization} overCap={overCap} alertTriggered={alertTriggered} />
            <div style={{ marginTop: '20px', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${budget.currentSpendUsd.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              of ${budget.hardCapUsd.toFixed(2)} hard cap
            </div>
            {saving && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--accent-primary)' }}>
                <RefreshCw size={12} className="animate-spin" /> Saving…
              </div>
            )}
          </div>

          {/* Cap controls */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '-4px' }}>Budget Caps</div>
            <EditableCap
              label="Hard Cap"
              value={budget.hardCapUsd}
              onSave={v => updateCap('hardCapUsd', v)}
            />
            <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)' }} />
            <EditableCap
              label="Soft Cap (Alert)"
              value={budget.softCapUsd}
              onSave={v => updateCap('softCapUsd', v)}
            />
            <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-Approve Below</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>${budget.autoApproveThresholdUsd}</div>
            </div>
          </div>

          {/* System Stats */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>System Stats</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={16} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {systemStats.totalSkillExecutions.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>skill executions</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color="var(--text-tertiary)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {systemStats.averageLoopLatencyMs}ms
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>avg loop latency</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--status-success)" />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {budget.alertTriggered ? '⚠ Alert' : '✓ Normal'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>budget status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>

          {/* Top Spenders Chart */}
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Agent Spend Breakdown</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{budget.monthKey}</div>
              </div>
              <TrendingUp size={18} color="var(--text-muted)" />
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, MAX_CHART]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Spend']}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                />
                <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--accent-primary)' : 'var(--border-strong)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Table below chart */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSpenders.map((s, i) => {
                const pct = budget.hardCapUsd > 0 ? (s.spend / budget.hardCapUsd) * 100 : 0;
                const agentName = s.agentId.replace('agent_', '').replace(/^\w/, c => c.toUpperCase());
                return (
                  <div key={s.agentId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: i === 0 ? 'var(--accent-subtle)' : 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '16px' }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{agentName}</div>
                      <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: i === 0 ? 'var(--accent-primary)' : 'var(--border-strong)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '60px', textAlign: 'right' }}>
                      ${s.spend.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
