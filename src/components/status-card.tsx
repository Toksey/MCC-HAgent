import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface StatusCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  badge?: string;
  href?: string;
}

export default function StatusCard({
  icon,
  title,
  value,
  subtitle,
  status = 'neutral',
  badge,
  href,
}: StatusCardProps) {
  const statusColorMap: Record<string, string> = {
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
    info: 'var(--status-info)',
    neutral: 'var(--text-tertiary)',
  };

  const inner = (
    <div className={`glass-card${href ? ' glass-card-link' : ''}`} style={{ padding: '24px', position: 'relative', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-sm)',
            background: `${statusColorMap[status]}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: statusColorMap[status],
          }}>
            {icon}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {badge && (
            <span className={`badge badge-${status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{badge}</span>
          )}
          {href && (
            <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Value */}
      <div
        className="counter-value"
        style={{
          fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)',
          lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: 'auto', marginBottom: subtitle ? '8px' : '0',
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{subtitle}</div>
      )}

      {/* Status glow line at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: '24px', right: '24px',
        height: '2px', borderRadius: '2px 2px 0 0',
        background: statusColorMap[status], opacity: 0.4,
      }} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
