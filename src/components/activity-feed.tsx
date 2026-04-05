'use client';

import { LogEntry } from '@/lib/types';
import { relativeTime } from '@/lib/parsers';

interface ActivityFeedProps {
  logs: LogEntry[];
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  const levelColors: Record<string, { dot: string; text: string; bg: string }> = {
    info: {
      dot: 'var(--text-tertiary)',
      text: 'var(--text-secondary)',
      bg: 'transparent',
    },
    warning: {
      dot: 'var(--status-warning)',
      text: 'var(--status-warning)',
      bg: 'var(--status-warning-bg)',
    },
    error: {
      dot: 'var(--status-error)',
      text: 'var(--status-error)',
      bg: 'var(--status-error-bg)',
    },
    debug: {
      dot: 'var(--text-muted)',
      text: 'var(--text-muted)',
      bg: 'transparent',
    },
  };

  return (
    <div
      className="glass-card-static"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="status-dot online"
            style={{ width: '6px', height: '6px' }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Live Activity
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
          }}
        >
          {logs.length} entries
        </span>
      </div>

      {/* Log entries */}
      <div
        className="feed-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            No activity logs available
          </div>
        ) : (
          logs.map((log, i) => {
            const colors = levelColors[log.level] || levelColors.info;
            return (
              <div
                key={i}
                style={{
                  padding: '8px 20px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  fontSize: '12px',
                  background: colors.bg,
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.bg;
                }}
              >
                <div
                  className="status-dot"
                  style={{
                    background: colors.dot,
                    marginTop: '4px',
                    width: '6px',
                    height: '6px',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.text,
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}
                  >
                    {log.message.length > 200
                      ? log.message.slice(0, 200) + '…'
                      : log.message}
                  </div>
                </div>
                <span
                  suppressHydrationWarning
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {relativeTime(log.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
