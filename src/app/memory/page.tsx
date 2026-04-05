'use client';

import { useState, useEffect } from 'react';
import { Database, Zap, HardDrive, Key, Loader2, Save, Trash2, CheckCircle2 } from 'lucide-react';

export default function MemoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        setSupabaseUrl(data.url || '');
        setSupabaseKey(data.key || '');
        setEnabled(data.enabled || false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch memory config', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: supabaseUrl,
          key: supabaseKey,
          enabled: enabled
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSaveMessage(data.message);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: '32px 40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={28} className="text-accent" />
            OpenBrain Memory
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
            Configure semantic, cross-agent continuous memory using Supabase pgvector. 
          </p>
        </div>
        
        {enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-primary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>MEMORY ACTIVE</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 className="spin" size={32} />
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ background: enabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', alignSelf: 'flex-start' }}>
                <HardDrive size={24} color={enabled ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{enabled ? 'Memory Framework Native' : 'Memory Framework Disabled'}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  When active, OpenClaw agents will autonomously spawn the embedded <code>openbrain.cjs</code> MCP server during execution, allowing them to instantly store, recall, and cross-reference interactions securely within your Postgres cluster.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Enable Memory Subsystem</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Agents will be given semantic database access</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={enabled} 
                  onChange={(e) => setEnabled(e.target.checked)} 
                  style={{ display: 'none' }} 
                />
                <div style={{ 
                  width: '44px', height: '24px', background: enabled ? 'var(--accent-primary)' : 'var(--border-strong)', 
                  borderRadius: '12px', position: 'relative', transition: 'background 0.2s' 
                }}>
                  <div style={{ 
                    width: '18px', height: '18px', background: 'white', borderRadius: '50%', 
                    position: 'absolute', top: '3px', left: enabled ? '23px' : '3px', transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}></div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Database size={14} />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://abcdefghijklmnopqr.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  disabled={!enabled}
                  style={{
                    width: '100%', padding: '12px 16px', background: !enabled ? 'var(--bg-card)' : 'var(--bg-elevated)', 
                    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', 
                    color: !enabled ? 'var(--text-muted)' : 'var(--text-primary)', outline: 'none', transition: 'all 0.2s',
                    opacity: !enabled ? 0.6 : 1
                  }}
                  required={enabled}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <Key size={14} />
                  Supabase Service Role Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  disabled={!enabled}
                  style={{
                    width: '100%', padding: '12px 16px', background: !enabled ? 'var(--bg-card)' : 'var(--bg-elevated)', 
                    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', 
                    color: !enabled ? 'var(--text-muted)' : 'var(--text-primary)', outline: 'none', transition: 'all 0.2s',
                    opacity: !enabled ? 0.6 : 1
                  }}
                  required={enabled}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={10} className="text-accent" />
                  We securely bridge this directly to the bundled executing context. Mission Control never persists this in a middleman cloud.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {saveMessage && (
                <div style={{ fontSize: '13px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s' }}>
                  <CheckCircle2 size={16} />
                  {saveMessage}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--accent-primary)', color: 'white',
                  padding: '10px 24px', borderRadius: 'var(--radius-md)',
                  border: 'none', fontWeight: 600, fontSize: '14px',
                  cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
                  transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
              >
                {saving ? (
                  <><Loader2 size={16} className="spin" /> Guarding...</>
                ) : (
                  <><Save size={16} /> Save Configuration</>
                )}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
