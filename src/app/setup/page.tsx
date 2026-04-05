'use client';

import { useState, useEffect } from 'react';
import { Zap, Search, CheckCircle2, AlertCircle, ArrowRight, Folder, Bot, Radio, Puzzle, RefreshCw } from 'lucide-react';

interface SetupStatus {
  configured: boolean;
  openclawHome: string;
  configExists: boolean;
  version?: string;
  agentCount?: number;
  channelCount?: number;
  pluginCount?: number;
}

export default function SetupPage() {
  const [step, setStep] = useState<'detecting' | 'found' | 'manual' | 'validating' | 'done'>('detecting');
  const [detected, setDetected] = useState<SetupStatus[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [manualPath, setManualPath] = useState('');
  const [validationResult, setValidationResult] = useState<SetupStatus | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if already configured
    fetch('/api/setup')
      .then(r => r.json())
      .then(status => {
        if (status.configured) {
          setValidationResult(status);
          setSelectedPath(status.openclawHome);
          setStep('done');
        } else {
          runDetection();
        }
      })
      .catch(() => runDetection());
  }, []);

  const runDetection = () => {
    setStep('detecting');
    fetch('/api/setup?action=detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => r.json())
      .then(d => {
        const installs = d.installations || [];
        setDetected(installs);
        if (installs.length > 0) {
          setSelectedPath(installs[0].openclawHome);
          setValidationResult(installs[0]);
          setStep('found');
        } else {
          setStep('manual');
        }
      })
      .catch(() => setStep('manual'));
  };

  const handleValidate = async (path: string) => {
    setStep('validating');
    setError('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openclawHome: path }),
      });
      const data = await res.json();
      if (data.ok) {
        setValidationResult(data.status);
        setSelectedPath(path);
        setStep('done');
      } else {
        setError(data.error || 'Validation failed');
        setStep('manual');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
      setStep('manual');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openclawHome: selectedPath }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep('done');
        setValidationResult(data.status);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100%', background: 'var(--bg-root)',
      padding: '20px',
    }}>
      <div style={{
        width: '560px', maxWidth: '100%',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'var(--accent-gradient)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)', marginBottom: '16px',
          }}>
            <Zap size={32} color="white" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Ares Command</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
            Connect to your OpenClaw installation to get started
          </p>
        </div>
        </div>

        {/* Step: Detecting */}
        {step === 'detecting' && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <Search size={32} color="var(--accent-primary)" className="animate-pulse" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Scanning for OpenClaw...
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Checking common installation paths
            </div>
          </div>
        )}

        {/* Step: Found */}
        {step === 'found' && (
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <CheckCircle2 size={20} color="var(--status-success)" />
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>OpenClaw Installation Detected</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {detected.map(install => (
                <button
                  key={install.openclawHome}
                  onClick={() => { setSelectedPath(install.openclawHome); setValidationResult(install); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    background: selectedPath === install.openclawHome ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedPath === install.openclawHome ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.2s',
                  }}
                >
                  <Folder size={18} color="var(--accent-primary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{install.openclawHome}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      v{install.version} · {install.agentCount} agents · {install.channelCount} channels · {install.pluginCount} plugins
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {validationResult && (
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px', fontWeight: 600 }}>Installation Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{validationResult.agentCount} Agents</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{validationResult.channelCount} Channels</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Puzzle size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{validationResult.pluginCount} Plugins</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>v{validationResult.version}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep('manual')} style={{
                flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
              }}>Enter Manually</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 20px', background: 'var(--accent-primary)', border: 'none',
                borderRadius: 'var(--radius-md)', color: 'white', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {saving ? 'Connecting...' : 'Connect & Launch'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Manual */}
        {step === 'manual' && (
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Locate OpenClaw
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              Enter the absolute path to your OpenClaw home directory (the folder containing <code style={{ color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: '3px' }}>openclaw.json</code>).
            </p>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <AlertCircle size={14} color="var(--status-error)" />
                <span style={{ fontSize: '12px', color: 'var(--status-error)' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                value={manualPath}
                onChange={e => setManualPath(e.target.value)}
                placeholder="/Users/username/.openclaw"
                style={{
                  width: '100%', padding: '12px', background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-mono)',
                }}
              />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Common paths: ~/.openclaw, ~/.config/openclaw
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={runDetection} style={{
                padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
              }}>Re-scan</button>
              <button
                onClick={() => handleValidate(manualPath)}
                disabled={!manualPath.trim()}
                style={{
                  flex: 1, padding: '10px', background: 'var(--accent-primary)', border: 'none',
                  borderRadius: 'var(--radius-md)', color: 'white', fontSize: '13px', fontWeight: 600,
                  cursor: manualPath.trim() ? 'pointer' : 'not-allowed',
                  opacity: manualPath.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <CheckCircle2 size={14} /> Validate & Connect
              </button>
            </div>
          </div>
        )}

        {/* Step: Validating */}
        {step === 'validating' && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <RefreshCw size={32} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Validating Configuration...
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Reading openclaw.json and verifying installation
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--status-success)" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Connected
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Ares Command is linked to:
            </div>
            <div style={{
              fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)',
              background: 'var(--bg-elevated)', padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              display: 'inline-block', marginBottom: '24px',
            }}>
              {selectedPath}
            </div>

            {validationResult && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{validationResult.agentCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Agents</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{validationResult.channelCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Channels</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{validationResult.pluginCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Plugins</div>
                </div>
              </div>
            )}

            <a href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', background: 'var(--accent-primary)', color: 'white',
              borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '14px',
              fontWeight: 600, boxShadow: 'var(--shadow-glow)',
            }}>
              Launch Dashboard <ArrowRight size={16} />
            </a>

            <div style={{ marginTop: '16px' }}>
              <button onClick={() => setStep('manual')} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px',
                cursor: 'pointer', textDecoration: 'underline',
              }}>
                Change installation path
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
