import { Html } from '@react-three/drei';
import { Task } from '@/lib/types';

export default function KanbanBoard({ position, rotation, tasks, theme }: { position: [number, number, number], rotation: [number, number, number], tasks: Task[], theme: 'light' | 'dark' }) {
  // Aggregate tasks by status
  const backlog = tasks.filter(t => t.status === 'backlog');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const review = tasks.filter(t => t.status === 'review');
  const done = tasks.filter(t => t.status === 'done');

  // Theme colors
  const bg = theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.95)';
  const border = theme === 'dark' ? '#334155' : '#cbd5e1';
  const text = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const textMuted = theme === 'dark' ? '#94a3b8' : '#64748b';
  const headerBg = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <group position={position} rotation={rotation}>
      {/* 3D Monitor Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.6, 0.1]} />
        <meshStandardMaterial color={theme === 'dark' ? '#0f172a' : '#94a3b8'} />
      </mesh>
      
      {/* Screen Glow (Emissive plane behind HTML) */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[4.0, 2.4]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1e293b' : '#ffffff'} emissive={theme === 'dark' ? '#0f172a' : '#ffffff'} emissiveIntensity={0.2} />
      </mesh>

      {/* Embedded HTML Kanban Board */}
      <Html 
        position={[0, 0, 0.052]} 
        transform 
        occlude 
        distanceFactor={1.5}
        zIndexRange={[0, 0]}
      >
        <div style={{
          width: '800px',
          height: '480px',
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: '12px',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif',
          color: text,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme === 'dark' ? '0 0 40px rgba(56, 189, 248, 0.1)' : '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          {/* Board Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `1px solid ${border}`, paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#3b82f6' }}>⚡</span> Ares Command Board
            </h1>
            <div style={{ display: 'flex', gap: '16px', fontSize: '16px', fontWeight: 600 }}>
              <div style={{ background: headerBg, padding: '8px 16px', borderRadius: '8px' }}>Active: {inProgress.length}</div>
              <div style={{ background: headerBg, padding: '8px 16px', borderRadius: '8px' }}>Total: {tasks.length}</div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
            {/* IN PROGRESS */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#eab308', marginBottom: '12px' }}>
                In Progress ({inProgress.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px' }}>
                {inProgress.slice(0, 4).map(t => (
                  <div key={t.id} style={{ background: headerBg, padding: '16px', borderRadius: '8px', borderLeft: '4px solid #eab308' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: textMuted }}>Agent: {t.agentId || 'Unassigned'}</div>
                  </div>
                ))}
                {inProgress.length === 0 && <div style={{ color: textMuted, fontStyle: 'italic', fontSize: '14px' }}>No active tasks.</div>}
              </div>
            </div>

            {/* REVIEW / BLOCKED */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '12px' }}>
                Review ({review.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px' }}>
                {review.slice(0, 4).map(t => (
                  <div key={t.id} style={{ background: headerBg, padding: '16px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: textMuted }}>Agent: {t.agentId || 'Unassigned'}</div>
                  </div>
                ))}
                {review.length === 0 && <div style={{ color: textMuted, fontStyle: 'italic', fontSize: '14px' }}>Queue empty.</div>}
              </div>
            </div>

            {/* DONE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22c55e', marginBottom: '12px' }}>
                Done ({done.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px' }}>
                {done.slice(0, 4).map(t => (
                  <div key={t.id} style={{ background: headerBg, padding: '16px', borderRadius: '8px', borderLeft: '4px solid #22c55e', opacity: 0.7 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'line-through' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: textMuted }}>Completed</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
