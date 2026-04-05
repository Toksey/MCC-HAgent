'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Key, Terminal, Cpu, RefreshCw, Shield, Play, AlertCircle, CheckCircle2, Clock, Wifi, Hash, ToggleLeft, ToggleRight, Trash2, Plus, Zap, Stethoscope, Database, Download, Heart } from 'lucide-react';

interface SettingsData {
  meta: any;
  wizard: any;
  gateway: any;
  env: any;
  auth: any;
  commands: any;
  session: any;
  hooks: any;
  messages: any;
  models: any;
}

interface CliResult {
  ok: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exitCode?: number;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'gateway' | 'env' | 'auth' | 'hooks' | 'cli' | 'system' | 'models' | 'credits'>('gateway');
  const [saving, setSaving] = useState(false);
  const [cliOutput, setCliOutput] = useState<CliResult | null>(null);
  const [cliRunning, setCliRunning] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (section: string, value: any) => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: value }),
      });
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const runCommand = async (command: string) => {
    setCliRunning(true);
    setCliOutput(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const result = await res.json();
      setCliOutput(result);
    } catch (err: any) {
      setCliOutput({ ok: false, command, stdout: '', stderr: err.message, exitCode: 1 });
    } finally {
      setCliRunning(false);
    }
  };

  const addEnvVar = () => {
    if (!newEnvKey.trim() || !data) return;
    const newEnv = { ...data.env, vars: { ...data.env.vars, [newEnvKey]: newEnvVal } };
    setData({ ...data, env: newEnv });
    handleSave('env', newEnv);
    setNewEnvKey('');
    setNewEnvVal('');
  };

  const removeEnvVar = (key: string) => {
    if (!data || !confirm(`Remove environment variable "${key}"?`)) return;
    const newVars = { ...data.env.vars };
    delete newVars[key];
    const newEnv = { ...data.env, vars: newVars };
    setData({ ...data, env: newEnv });
    handleSave('env', newEnv);
  };

  const toggleHook = (hookId: string) => {
    if (!data) return;
    const newHooks = { ...data.hooks };
    if (newHooks.internal?.entries?.[hookId]) {
      newHooks.internal.entries[hookId].enabled = !newHooks.internal.entries[hookId].enabled;
    }
    setData({ ...data, hooks: newHooks });
    handleSave('hooks', newHooks);
  };

  const TABS = [
    { id: 'gateway', label: 'Gateway', icon: Globe },
    { id: 'env', label: 'Env Vars', icon: Key },
    { id: 'auth', label: 'Auth Profiles', icon: Shield },
    { id: 'models', label: 'Models API', icon: Database },
    { id: 'hooks', label: 'Hooks', icon: Zap },
    { id: 'cli', label: 'CLI Terminal', icon: Terminal },
    { id: 'system', label: 'System Info', icon: Cpu },
    { id: 'credits', label: 'Credits', icon: Heart },
  ] as const;

  const CLI_COMMANDS = [
    { cmd: 'doctor', label: 'Run Doctor', icon: Stethoscope, desc: 'Diagnose configuration and health issues' },
    { cmd: 'status', label: 'Check Status', icon: Wifi, desc: 'Check daemon and service status' },
    { cmd: 'restart', label: 'Restart Daemon', icon: RefreshCw, desc: 'Restart the OpenClaw daemon process' },
    { cmd: 'update', label: 'Update OpenClaw', icon: Download, desc: 'Install latest version via NPM' },
    { cmd: 'version', label: 'Version', icon: Hash, desc: 'Display installed version info' },
    { cmd: 'stop', label: 'Stop Daemon', icon: AlertCircle, desc: 'Stop the OpenClaw daemon' },
    { cmd: 'start', label: 'Start Daemon', icon: Play, desc: 'Start the OpenClaw daemon' },
  ];

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading settings…</div>;

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <SettingsIcon size={24} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Settings</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            OpenClaw system configuration, environment, and daemon management
          </p>
        </div>
        {saving && <span style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} className="animate-spin" /> Saving…</span>}
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
        {/* Tab sidebar */}
        <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: tab === t.id ? 'var(--accent-subtle)' : 'transparent',
                border: 'none', borderRadius: 'var(--radius-md)', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <t.icon size={16} color={tab === t.id ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>

          {/* Gateway */}
          {tab === 'gateway' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Gateway Configuration</h3>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Port</label>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{data.gateway.port || 'Not set'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Mode</label>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{data.gateway.mode || 'local'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Bind</label>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{data.gateway.bind || 'loopback'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Auth Mode</label>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{data.gateway.auth?.mode || 'none'}</div>
                  </div>
                </div>
              </div>

              {data.gateway.auth?.token && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Auth Token</label>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all' }}>
                    {data.gateway.auth.token.slice(0, 8)}{'•'.repeat(24)}{data.gateway.auth.token.slice(-8)}
                  </div>
                </div>
              )}

              {data.gateway.tailscale && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Tailscale</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mode: <strong>{data.gateway.tailscale.mode}</strong></span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Reset on Exit: <strong>{data.gateway.tailscale.resetOnExit ? 'Yes' : 'No'}</strong></span>
                  </div>
                </div>
              )}

              {data.gateway.controlUi && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>Allowed Origins</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(data.gateway.controlUi.allowedOrigins || []).map((origin: string, i: number) => (
                      <span key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '999px', fontFamily: 'var(--font-mono)' }}>{origin}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Environment Variables */}
          {tab === 'env' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Environment Variables</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{Object.keys(data.env.vars || {}).length} variables</span>
              </div>

              {Object.entries(data.env.vars || {}).map(([key, val]) => (
                <div key={key} className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{key}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      {String(val).slice(0, 12)}{'•'.repeat(Math.min(20, Math.max(0, String(val).length - 12)))}
                    </div>
                  </div>
                  <button onClick={() => removeEnvVar(key)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Add New Variable</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={newEnvKey} onChange={e => setNewEnvKey(e.target.value)} placeholder="VARIABLE_NAME" style={{ flex: 1, padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
                  <input value={newEnvVal} onChange={e => setNewEnvVal(e.target.value)} placeholder="value" type="password" style={{ flex: 2, padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-mono)' }} />
                  <button onClick={addEnvVar} disabled={!newEnvKey.trim()} style={{ padding: '8px 14px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: newEnvKey.trim() ? 1 : 0.5 }}>
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Models */}
          {tab === 'models' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Model Providers</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>Configure the API keys used for agent inference and reasoning.</p>

              {Object.entries(data.models?.providers || {}).map(([providerId, config]: [string, any]) => (
                <div key={providerId} className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{providerId.replace('-', ' ')}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{config.baseUrl}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>Available Models</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(config.models || []).map((m: any) => (
                        <span key={m.id} style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          {m.id} {m.reasoning && <span style={{ color: 'var(--accent-primary)' }}>✨</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auth Profiles (read-only) */}
          {tab === 'auth' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Authentication Profiles</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>Configured provider auth profiles. These are managed by the OpenClaw CLI.</p>

              {Object.entries(data.auth?.profiles || {}).map(([key, profile]: [string, any]) => (
                <div key={key} className="glass-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{key}</span>
                    <span className="badge" style={{ fontSize: '10px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>{profile.mode}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Provider: <strong style={{ color: 'var(--text-secondary)' }}>{profile.provider}</strong>
                    {profile.email && <> · Email: <strong style={{ color: 'var(--text-secondary)' }}>{profile.email}</strong></>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hooks */}
          {tab === 'hooks' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Lifecycle Hooks</h3>

              {data.hooks?.internal?.entries && Object.entries(data.hooks.internal.entries).map(([hookId, hook]: [string, any]) => (
                <div key={hookId} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{hookId}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Internal hook · {hook.enabled ? 'Active' : 'Disabled'}</div>
                  </div>
                  <button onClick={() => toggleHook(hookId)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: hook.enabled ? 'var(--status-success)' : 'var(--text-muted)',
                  }}>
                    {hook.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              ))}

              {(!data.hooks?.internal?.entries || Object.keys(data.hooks.internal.entries).length === 0) && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No hooks configured</div>
              )}
            </div>
          )}

          {/* CLI Terminal */}
          {tab === 'cli' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>OpenClaw CLI</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>Run diagnostics, restart the daemon, and manage the OpenClaw service.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {CLI_COMMANDS.map(c => (
                  <button key={c.cmd} onClick={() => runCommand(c.cmd)} disabled={cliRunning}
                    className="glass-card element-hover"
                    style={{
                      padding: '16px', cursor: 'pointer', border: '1px solid var(--border-subtle)',
                      background: c.cmd === 'update' ? 'var(--accent-primary)' : 'var(--bg-card)', textAlign: 'left',
                      opacity: cliRunning ? 0.6 : 1, transition: 'all 0.15s',
                      boxShadow: c.cmd === 'update' ? '0 0 15px var(--accent-primary)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <c.icon size={16} color={c.cmd === 'update' ? 'white' : 'var(--accent-primary)'} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: c.cmd === 'update' ? 'white' : 'var(--text-primary)' }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: c.cmd === 'update' ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)', lineHeight: 1.4 }}>{c.desc}</div>
                  </button>
                ))}
              </div>

              {cliRunning && (
                <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                  <RefreshCw size={20} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Executing command…</div>
                </div>
              )}

              {cliOutput && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {cliOutput.ok ? <CheckCircle2 size={16} color="var(--status-success)" /> : <AlertCircle size={16} color="var(--status-error)" />}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      $ {cliOutput.command}
                    </span>
                    {cliOutput.exitCode !== undefined && cliOutput.exitCode !== 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--status-error)' }}>Exit: {cliOutput.exitCode}</span>
                    )}
                  </div>
                  {cliOutput.stdout && (
                    <pre style={{
                      fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                      background: '#1e1e1e', padding: '14px', borderRadius: 'var(--radius-sm)',
                      overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto',
                      margin: 0,
                    }}>{cliOutput.stdout}</pre>
                  )}
                  {cliOutput.stderr && (
                    <pre style={{
                      fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--status-error)',
                      background: 'rgba(239,68,68,0.08)', padding: '14px', borderRadius: 'var(--radius-sm)',
                      marginTop: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: '8px 0 0 0',
                    }}>{cliOutput.stderr}</pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* System Info */}
          {tab === 'system' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>System Information</h3>

              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Version</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>{data.meta?.lastTouchedVersion || 'Unknown'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Last Config Touch</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{data.meta?.lastTouchedAt ? new Date(data.meta.lastTouchedAt).toLocaleString() : 'Unknown'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Last Wizard Run</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{data.wizard?.lastRunAt ? new Date(data.wizard.lastRunAt).toLocaleString() : 'Never'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Wizard Command</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>openclaw {data.wizard?.lastRunCommand || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Commands Mode</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{data.commands?.native || 'auto'} / Skills: {data.commands?.nativeSkills || 'auto'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Session Scope</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{data.session?.dmScope || 'default'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Message Ack Scope</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{data.messages?.ackReactionScope || 'default'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Installation Path</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{process.env.OPENCLAW_HOME || '~/.openclaw'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Credits */}
          {tab === 'credits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={18} color="var(--status-error)" fill="var(--status-error)" /> 
                  Ecosystem Kudos
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>Ares Command is built on the shoulders of giants. Here are the amazing OSS frameworks powering this interface.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                
                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Terminal size={14} color="white" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>OpenClaw Framework</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    The underlying multi-agent framework mapping instructions safely into workspace boundaries.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={14} color="white" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>GStack & Gary Tan</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Supplying the sleek team management aesthetic and overarching system component architecture.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={14} color="white" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>OpenBrain</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Memory architecture framework — by Nate B. Jones. Included as bundled MCP.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={14} color="white" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Claw3D SDK</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Rendering the vibrant, 3D animated Office interfaces inside the browser for real-time visualization.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
