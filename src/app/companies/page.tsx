'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, CheckCircle2, Target, Zap, Shield } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  mission?: string;
  goals?: string[];
  defaultMode: 'conservative' | 'maximizer';
  createdAt: string;
  updatedAt: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', mission: '', goals: '', defaultMode: 'conservative' as 'conservative' | 'maximizer' });

  const fetchCompanies = () => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((d) => {
        setCompanies(d.companies || []);
        setActiveCompanyId(d.activeCompanyId || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleCreate = async () => {
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        mission: form.mission,
        goals: form.goals.split('\n').filter(Boolean),
        defaultMode: form.defaultMode,
      }),
    });
    setForm({ name: '', mission: '', goals: '', defaultMode: 'conservative' });
    setShowCreate(false);
    fetchCompanies();
  };

  const switchTo = async (id: string) => {
    await fetch('/api/companies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ switchTo: id }),
    });
    setActiveCompanyId(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/companies?id=${id}`, { method: 'DELETE' });
    fetchCompanies();
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Companies</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '6px' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Companies</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Manage your operational contexts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New Company
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Create Company
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Company name"
              style={{
                padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            />
            <input
              value={form.mission}
              onChange={(e) => setForm({ ...form, mission: e.target.value })}
              placeholder="Mission statement (optional)"
              style={{
                padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            />
            <textarea
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="Goals (one per line)"
              rows={3}
              style={{
                padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setForm({ ...form, defaultMode: 'conservative' })}
                style={{
                  flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: form.defaultMode === 'conservative' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  border: '1px solid', borderColor: form.defaultMode === 'conservative' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500,
                }}
              >
                <Shield size={14} /> Conservative
              </button>
              <button
                onClick={() => setForm({ ...form, defaultMode: 'maximizer' })}
                style={{
                  flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: form.defaultMode === 'maximizer' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  border: '1px solid', borderColor: form.defaultMode === 'maximizer' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500,
                }}
              >
                <Zap size={14} /> Maximizer
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!form.name} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: form.name ? 1 : 0.5 }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {companies.map((co) => {
          const isActive = co.id === activeCompanyId;
          return (
            <div
              key={co.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderColor: isActive ? 'var(--accent-primary)' : undefined,
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>ACTIVE</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={20} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{co.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {co.defaultMode === 'maximizer' ? <Zap size={10} /> : <Shield size={10} />}
                    {co.defaultMode} mode
                  </div>
                </div>
              </div>
              {co.mission && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  {co.mission}
                </p>
              )}
              {co.goals && co.goals.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  {co.goals.map((g, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                      <Target size={10} style={{ flexShrink: 0, marginTop: '2px' }} /> {g}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isActive && (
                  <button
                    onClick={() => switchTo(co.id)}
                    style={{
                      flex: 1, padding: '8px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(co.id)}
                  style={{
                    padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {companies.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <Building2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No companies yet</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
              Create your first company to start organizing your agent ecosystem
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
