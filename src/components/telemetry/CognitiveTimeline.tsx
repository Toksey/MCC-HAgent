'use client';

import { useState } from 'react';
import { Brain, Zap, Globe, Circle, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import type { CognitiveAction } from '@/lib/hermes';

// Helper to format ISO to 12-hour time
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Colors for cognitive phases
const ACTION_COLORS: Record<string, string> = {
  observing:  '#60a5fa',
  thinking:   '#a78bfa',
  acting:     '#34d399',
  reflect:    '#fbbf24',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  observing:  <Globe size={13} />,
  thinking:   <Brain size={13} />,
  acting:     <Zap size={13} />,
  reflect:    <Circle size={13} fill="currentColor" />,
};

function TimelineNode({ action, isLast }: { action: CognitiveAction; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = ACTION_COLORS[action.type] || 'var(--text-muted)';
  const icon = ACTION_ICONS[action.type] || <Circle size={13} />;

  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
      
      {/* Timeline Stem & Node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: 28, height: 28, borderRadius: '50%', background: `${color}15`,
          border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, flexShrink: 0, zIndex: 2
        }}>
          {icon}
        </div>
        {!isLast && (
          <div style={{ flex: 1, width: 2, background: 'var(--border-subtle)', margin: '4px 0' }} />
        )}
      </div>

      {/* Content Block */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '24px' }}>
        <div 
          onClick={() => action.metadata && setExpanded(!expanded)}
          style={{ 
            padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)', cursor: action.metadata ? 'pointer' : 'default',
            display: 'flex', flexDirection: 'column', gap: '6px', transition: 'border 0.2s',
          }}
          onMouseEnter={(e) => { if(action.metadata) e.currentTarget.style.borderColor = 'var(--border-default)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {action.type}
              </span>
              {action.metadata && (
                expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(action.timestamp)}
            </span>
          </div>

          {/* Action text */}
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {action.content}
          </div>

          {/* Expandable Metadata */}
          {expanded && action.metadata && (
            <div style={{ 
              marginTop: '8px', padding: '10px', background: 'var(--bg-card)', 
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
              fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              overflowX: 'auto', display: 'flex', gap: '8px'
            }}>
              <CornerDownRight size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {typeof action.metadata === 'string' ? action.metadata : JSON.stringify(action.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function CognitiveTimeline({ actions }: { actions: CognitiveAction[] }) {
  // Show most recent 50 actions maximum 
  const displayActions = actions.slice(0, 50);

  return (
    <div className="glass-card-static" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Cognitive Timeline
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{actions.length} events logged</span>
      </div>

      <div style={{ 
        display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto', 
        paddingRight: '12px', margin: '0 -12px', paddingLeft: '12px'
      }}>
        {displayActions.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No cognitive actions recorded yet.
          </div>
        ) : (
          displayActions.map((action, idx) => (
            <TimelineNode key={action.id} action={action} isLast={idx === displayActions.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
