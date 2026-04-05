'use client';

import { useState, useEffect } from 'react';
import { Puzzle, ToggleLeft, ToggleRight, CheckCircle2, Box, Clock, FolderOpen, ExternalLink } from 'lucide-react';

interface Plugin {
  name: string;
  enabled: boolean;
  installed: boolean;
  source: string;
  version: string | null;
  installPath: string | null;
  installedAt: string | null;
}

const PLUGIN_META: Record<string, { desc: string; emoji: string }> = {
  whatsapp: { desc: 'WhatsApp messaging channel integration (Business API / self-chat mode)', emoji: '📱' },
  telegram: { desc: 'Telegram bot channel integration with streaming support', emoji: '✈️' },
  'google-gemini-cli-auth': { desc: 'Google Gemini CLI OAuth authentication provider', emoji: '🔐' },
  'voice-call': { desc: 'Voice call interface for real-time agent conversations', emoji: '📞' },
  nemoclaw: { desc: 'NemoClaw advanced reasoning and planning extension', emoji: '🧠' },
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/plugins').then(r => r.json()).then(d => { setPlugins(d.plugins || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleToggle = async (name: string, enabled: boolean) => {
    setToggling(name);
    try {
      await fetch('/api/plugins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, enabled: !enabled }),
      });
      setPlugins(prev => prev.map(p => p.name === name ? { ...p, enabled: !enabled } : p));
    } catch (err) {
      console.error('Toggle failed', err);
    } finally {
      setToggling(null);
    }
  };

  const enabledCount = plugins.filter(p => p.enabled).length;

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Puzzle size={24} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Plugins</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            Manage OpenClaw plugins and extensions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontSize: '12px' }}>
            {enabledCount}/{plugins.length} active
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Total</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{plugins.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Enabled</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-success)' }}>{enabledCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Externally Installed</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{plugins.filter(p => p.installed).length}</div>
        </div>
      </div>

      {/* Plugins list */}
      <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading plugins…</div>
        ) : plugins.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <Puzzle size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No plugins found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Install plugins via the OpenClaw CLI: <code style={{ color: 'var(--accent-primary)' }}>openclaw plugin install &lt;name&gt;</code></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plugins.map(plugin => {
              const meta = PLUGIN_META[plugin.name] || { desc: 'Custom plugin', emoji: '🧩' };
              return (
                <div key={plugin.name} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                    background: plugin.enabled ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                    border: `1px solid ${plugin.enabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.2s',
                  }}>
                    {meta.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{plugin.name}</span>
                      {plugin.version && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '999px', fontFamily: 'var(--font-mono)' }}>v{plugin.version}</span>
                      )}
                      <span className="badge" style={{
                        fontSize: '10px',
                        background: plugin.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                        color: plugin.enabled ? 'var(--status-success)' : 'var(--text-muted)',
                      }}>
                        {plugin.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: '6px' }}>
                      {meta.desc}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Box size={11} /> {plugin.source}
                      </span>
                      {plugin.installedAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> Installed {new Date(plugin.installedAt).toLocaleDateString()}
                        </span>
                      )}
                      {plugin.installPath && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                          <FolderOpen size={11} /> {plugin.installPath.split('/').slice(-2).join('/')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(plugin.name, plugin.enabled)}
                    disabled={toggling === plugin.name}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
                      color: plugin.enabled ? 'var(--status-success)' : 'var(--text-muted)',
                      opacity: toggling === plugin.name ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                  >
                    {plugin.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
