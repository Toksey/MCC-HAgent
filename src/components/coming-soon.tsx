import { ReactNode } from 'react';

interface ComingSoonPageProps {
  title: string;
  emoji: string;
  description: string;
  phase: number;
  children?: ReactNode;
}

export default function ComingSoonPage({
  title,
  emoji,
  description,
  phase,
}: ComingSoonPageProps) {
  return (
    <div
      className="page-enter"
      style={{
        padding: '28px 32px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '420px',
        }}
      >
        <div
          style={{
            fontSize: '56px',
            marginBottom: '16px',
            filter: 'grayscale(0.3)',
          }}
        >
          {emoji}
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-tertiary)',
            lineHeight: 1.6,
            margin: '0 0 24px 0',
          }}
        >
          {description}
        </p>
        <div
          className="badge badge-info"
          style={{
            fontSize: '11px',
            padding: '4px 12px',
          }}
        >
          Phase {phase}
        </div>
      </div>
    </div>
  );
}
