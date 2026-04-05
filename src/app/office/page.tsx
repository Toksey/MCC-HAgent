'use client';

import { useState, useEffect } from 'react';
import Scene from '@/components/office/Scene';
import { OpenClawConfig, Task } from '@/lib/types';
import { Loader2, Settings2, Moon, Sun, Monitor, User, Shapes, Sparkles } from 'lucide-react';

export default function OfficePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [avatarStyle, setAvatarStyle] = useState<'robot' | 'human' | 'geometric' | 'hologram'>('robot');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json())
    ]).then(([agentsData, tasksData]) => {
      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'var(--text-tertiary)' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: '12px', fontSize: '14px' }}>Waking up agents...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Scene agents={agents} tasks={tasks} theme={theme} avatarStyle={avatarStyle} />
      
      {/* HUD Info */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', pointerEvents: 'none' }}>
        <div className="badge badge-primary" style={{ fontSize: '13px', padding: '6px 12px', backdropFilter: 'blur(8px)', background: 'rgba(16, 185, 129, 0.2)' }}>
          Real-time Visualization Engine Active
        </div>
      </div>

      {/* Settings Toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute', top: '24px', right: '24px', zIndex: 100,
          background: 'rgba(20, 20, 20, 0.8)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white',
          padding: '10px', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transition: 'all 0.2s',
        }}
      >
        <Settings2 size={20} />
      </button>

      {/* Settings Sidebar */}
      <div style={{
        position: 'absolute', top: '72px', right: sidebarOpen ? '24px' : '-300px',
        width: '280px', background: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px',
        padding: '20px', color: 'white', transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 90
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings2 size={16} color="var(--accent-primary)" /> Visualization Settings
        </h3>

        {/* Environment Theme */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Environment Theme</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => setTheme('dark')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px',
              background: theme === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme === 'dark' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer'
            }}>
              <Moon size={14} /> Dark
            </button>
            <button onClick={() => setTheme('light')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px',
              background: theme === 'light' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${theme === 'light' ? '#facc15' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer'
            }}>
              <Sun size={14} /> Light
            </button>
          </div>
        </div>

        {/* Avatar Style */}
        <div>
          <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Avatar Style</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'robot', label: 'Robot (Mecha)', icon: Monitor },
              { id: 'human', label: 'Human (Blocky)', icon: User },
              { id: 'geometric', label: 'Geometric (Abstract)', icon: Shapes },
              { id: 'hologram', label: 'Holographic', icon: Sparkles }
            ].map(style => (
              <button key={style.id} onClick={() => setAvatarStyle(style.id as any)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', textAlign: 'left',
                background: avatarStyle === style.id ? 'var(--accent-subtle)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${avatarStyle === style.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px', color: '#fff', fontSize: '13px', cursor: 'pointer'
              }}>
                <style.icon size={16} color={avatarStyle === style.id ? 'var(--accent-primary)' : '#9ca3af'} />
                {style.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
