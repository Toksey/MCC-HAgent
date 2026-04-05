'use client';

import { Activity, Shield, Cpu, Globe, Zap, AlertTriangle, Circle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { TelemetryState, HermesAgent } from '@/lib/hermes';

const LOOP_PHASE_COLORS: Record<string, string> = {
  idle:       'var(--text-muted)',
  observing:  '#60a5fa',
  thinking:   '#a78bfa',
  acting:     '#34d399',
  paused:     '#f59e0b',
  error:      '#ef4444',
};

const LOOP_PHASE_ICONS: Record<string, React.ReactNode> = {
  idle:       <Circle size={14} />,
  observing:  <Globe size={14} />,
  thinking:   <Cpu size={14} />,
  acting:     <Zap size={14} />,
  paused:     <Circle size={14} fill="currentColor" />,
  error:      <AlertTriangle size={14} />,
};

export function AgentHealthCard({ state, agent }: { state: TelemetryState; agent: HermesAgent }) {
  // Generate visual mock history for smooth charts based on current state latency
  const baseLatency = state.latencyMs || 250;
  const mockData = Array.from({ length: 15 }).map((_, i) => ({
    time: i,
    latency: Math.max(50, baseLatency + (Math.random() * 100 - 50)),
  }));

  const isHealthy = state.errorRate < 5;
  const loopColor = LOOP_PHASE_COLORS[state.loopPhase] || 'var(--accent-primary)';

  return (
    <div className="glass-card-static" style={{ 
      display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', position: 'relative', overflow: 'hidden' 
    }}>
      {/* Background glow base on phase */}
      <div style={{
        position: 'absolute', top: -100, right: -100, width: 250, height: 250, 
        background: `radial-gradient(circle, ${loopColor}20 0%, transparent 70%)`, pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color={loopColor} />
          System Health & Telemetry
        </h3>
        
        {/* Loop Phase Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
          borderRadius: '99px', background: `${loopColor}15`, border: `1px solid ${loopColor}30`,
          color: loopColor, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          {LOOP_PHASE_ICONS[state.loopPhase]} {state.loopPhase}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {/* Latency */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response Latency</span>
          <div style={{ fontSize: '24px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {state.latencyMs.toFixed(0)}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ms</span>
          </div>
          <div style={{ height: 35, marginTop: 'auto', marginLeft: '-16px', marginRight: '-16px', marginBottom: '-16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={loopColor} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={loopColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="latency" stroke={loopColor} fill="url(#latencyGrad)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Rate */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: `1px solid ${isHealthy ? 'var(--border-subtle)' : '#ef444450'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Error Rate</span>
          <div style={{ fontSize: '24px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isHealthy ? '#34d399' : '#ef4444' }}>
            {state.errorRate.toFixed(1)}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
            {isHealthy ? 'Nominal operation' : 'Elevated failures detected!'}
          </div>
        </div>

        {/* Uptime */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</span>
          <div style={{ fontSize: '24px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {Math.floor(state.uptimeSeconds / 3600)}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>h</span> {Math.floor((state.uptimeSeconds % 3600) / 60)}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>m</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
            Continuous session
          </div>
        </div>

        {/* Autonomy Level */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autonomy Mode</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--accent-primary)" />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {agent.autonomyLevel}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
             Policy gate active
          </div>
        </div>
      </div>
    </div>
  );
}
