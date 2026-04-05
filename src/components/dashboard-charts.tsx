'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';

/* ─── MOCK DATA GENERATOR FOR API USAGE ─── */
function generateUsageData(totalCalls: number) {
  // Try to generate a realistic looking trailing 7-day pattern
  // anchoring the last day roughly to an expected daily average based on total
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = new Date().getDay(); // 0 is Sunday
  
  // Create an array of the last 7 day names
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    let d = todayIdx - i;
    if (d <= 0) d += 7;
    // JS dates: 0=Sun, 1=Mon, ..., 6=Sat. 
    // Our days array: 0=Mon, 1=Tue... wait: days[0]='Mon'. let's map: 
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    last7Days.push(dayMap[d === 7 ? 0 : d]);
  }

  // Base daily average
  const dailyAvg = totalCalls > 100 ? totalCalls / 30 : 50; 
  
  return last7Days.map((day, i) => {
    // Add some noise and an upward trend
    const noise = (Math.random() - 0.2) * (dailyAvg * 0.5);
    const trend = i * (dailyAvg * 0.1);
    const val = Math.max(0, Math.floor(dailyAvg + noise + trend));
    return { name: day, calls: val };
  });
}

/* ─── API USAGE CHART COMPONENT ─── */
export function ApiUsageChart({ totalCalls }: { totalCalls: number }) {
  const [data, setData] = useState<{name: string, calls: number}[]>([]);
  
  // Generate data only on client to avoid hydration mismatch
  useEffect(() => {
    setData(generateUsageData(totalCalls));
  }, [totalCalls]);

  if (data.length === 0) return <div style={{ height: 250 }} />;

  return (
    <div style={{ height: 250, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-elevated)', 
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              color: 'var(--text-primary)',
              fontSize: '12px'
            }}
            itemStyle={{ color: 'var(--accent-primary)', fontWeight: 600 }}
          />
          <Area 
            type="monotone" 
            dataKey="calls" 
            stroke="var(--accent-primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCalls)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── EXPANDABLE BENTO MODULE COMPONENT ─── */
export function ExpandableModule({ 
  title, 
  icon, 
  badge, 
  defaultExpanded = false,
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: expanded ? 'auto' : '100%' }}>
      {/* Header (Clickable) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="element-hover"
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {icon}
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          {badge && (
            <span className="badge badge-info" style={{ fontSize: '10px' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div style={{ padding: '0', flex: 1, animation: 'fadeIn 0.2s ease-out' }}>
          {children}
        </div>
      )}
    </div>
  );
}
