'use client';

import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Search, ExternalLink, Tag, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  status: 'ready' | 'missing';
  path: string;
  sizeBytes: number;
}

interface SkillsData {
  skills: Skill[];
  summary: { total: number; ready: number; missing: number; mcpCount: number };
}

const REGISTRIES = [
  { name: 'ClawHub', count: '13,000+ skills', url: 'https://github.com/topics/openclaw-skill', desc: 'Primary public registry' },
  { name: 'VoltAgent', count: '5,000+ skills', url: 'https://github.com/VoltAgent/awesome-openclaw-skills', desc: 'Curated awesome-list' },
  { name: 'Claude Library', count: '200+ skills', url: 'https://github.com/alirezarezvani/claude-skills', desc: 'Official API library' },
  { name: 'LobeHub', count: 'Marketplace', url: 'https://chat-preview.lobehub.com/market', desc: 'Agent skills marketplace' },
];

const SKILL_ICONS: Record<string, string> = {
  'agency-roster': '🎭',
  'agent-browser': '🌐',
  'antigravity': '⚡',
  'app-ideas': '💡',
  'business-advisory-council': '🏛️',
  'business-ops': '📊',
  'company-sop': '📋',
  'content-linkedin': '🔗',
  'content-pipeline': '🚀',
  'content-video': '🎥',
  'cto-developer': '💻',
  'daily-briefing': '📰',
  'github': '🐙',
  'gog': '🔍',
  'meeting-prep': '📅',
  'smart-home': '🏠',
  'summarize': '📝',
  'tavily-search': '🔎',
  'wacli': '💬',
  'you-com': '🌐',
};

export default function SkillsPage() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'local' | 'community'>('local');

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Record<string, any>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/skills?env=${activeTab}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [activeTab]);

  const runSecurityScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/skills/scan');
      const data = await res.json();
      if (data.success && data.scanResults) {
        const map: Record<string, any> = {};
        data.scanResults.forEach((r: any) => { map[r.id] = r; });
        setScanResults(map);
      }
    } catch (e) {
      console.error(e);
    }
    setIsScanning(false);
  };

  const filtered = (data?.skills || []).filter(s => {
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Skills Manager
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '6px 0 0 0' }}>
            {data?.summary.total || 0} skills installed · {data?.summary.ready || 0} ready
          </p>
        </div>
        {/* Summary badges */}
        {data && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-success">{data.summary.ready} Ready</span>
            {data.summary.missing > 0 && <span className="badge badge-error">{data.summary.missing} Missing</span>}
            {data.summary.mcpCount > 0 && <span className="badge badge-primary">{data.summary.mcpCount} Active MCPs</span>}
            
            <button 
              onClick={runSecurityScan}
              disabled={isScanning}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: Object.keys(scanResults).length > 0 ? 'var(--bg-card)' : 'var(--accent-primary)',
                color: Object.keys(scanResults).length > 0 ? 'var(--text-primary)' : 'white',
                border: Object.keys(scanResults).length > 0 ? '1px solid var(--border-default)' : 'none',
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                fontSize: '12px', fontWeight: 600, cursor: isScanning ? 'wait' : 'pointer',
                marginLeft: '12px'
              }}
            >
              {Object.keys(scanResults).length > 0 ? <ShieldCheck size={14} color="var(--status-success)" /> : <ShieldAlert size={14} />}
              {isScanning ? 'Scanning...' : Object.keys(scanResults).length > 0 ? 'Scan Complete' : 'Run Security Scan'}
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', flexShrink: 0 }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills by name, description, or tag…"
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Community Registries */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Community Registries
        </h3>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="feed-scroll">
           {REGISTRIES.map(r => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{
              flex: '0 0 auto', width: '200px', padding: '12px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', textDecoration: 'none',
              cursor: 'pointer', transition: 'all 0.2s', display: 'block',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                <ExternalLink size={14} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 500, marginBottom: '4px' }}>{r.count}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.desc}</div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('local')}
            style={{ fontSize: '15px', fontWeight: 600, color: activeTab === 'local' ? 'var(--accent-primary)' : 'var(--text-tertiary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'color 0.2s', borderBottom: activeTab === 'local' ? '2px solid var(--accent-primary)' : '2px solid transparent', paddingBottom: '4px' }}>
            Installed Local Skills
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            style={{ fontSize: '15px', fontWeight: 600, color: activeTab === 'community' ? 'var(--accent-primary)' : 'var(--text-tertiary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'color 0.2s', borderBottom: activeTab === 'community' ? '2px solid var(--accent-primary)' : '2px solid transparent', paddingBottom: '4px' }}>
            Community Registry
          </button>
        </div>
        {search && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"</span>}
      </div>

      {/* Skills grid */}
      <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading skills…</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <Wrench size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No local skills found</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {search ? `Your local node has no match for "${search}". To search public communities, visit the ClawHub external registry link above.` : 'No skills are installed yet.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {filtered.map(skill => {
              const icon = SKILL_ICONS[skill.id] || '🔧';
              const isOpen = expanded === skill.id;
              return (
                <div
                  key={skill.id}
                  onClick={() => setExpanded(isOpen ? null : skill.id)}
                  className="glass-card"
                  style={{ padding: '16px', cursor: 'pointer', transition: 'all 0.2s', border: isOpen ? '1px solid var(--accent-primary)' : undefined }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{skill.name}</div>
                        {activeTab === 'local' ? (
                          <span title="Installed Locally" style={{ display: 'flex' }}><CheckCircle size={13} color="var(--status-success)" /></span>
                        ) : (
                          <span style={{ fontSize: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>Remote Registry</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                        {skill.description.length > 80 ? skill.description.slice(0, 80) + '…' : skill.description}
                      </div>

                      {scanResults[skill.id] && scanResults[skill.id].status !== 'safe' && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: scanResults[skill.id].status === 'critical' ? 'var(--status-error)' : 'var(--status-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} />
                          {scanResults[skill.id].alerts.length} Exploit Vulnerabilit{scanResults[skill.id].alerts.length === 1 ? 'y' : 'ies'} Found
                        </div>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '10px' }}>
                        {skill.description}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {skill.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: '10px', padding: '2px 7px',
                            background: 'var(--accent-subtle)', color: 'var(--accent-primary)',
                            borderRadius: '99px', fontWeight: 500,
                          }}>
                            {tag}
                          </span>
                        ))}
                        {skill.tags.length === 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {skill.id}
                          </span>
                        )}
                      </div>

                      {scanResults[skill.id] && scanResults[skill.id].alerts.map((alert: any, i: number) => (
                        <div key={i} style={{ 
                          padding: '8px', marginBottom: '8px', 
                          background: alert.type === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${alert.type === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                          borderRadius: '6px'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: alert.type === 'high' ? 'var(--status-error)' : 'var(--status-warning)' }}>
                            {alert.message}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                            {alert.line}
                          </div>
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          v{skill.version} · by {skill.author}
                        </div>
                        {activeTab === 'community' && (
                          <button style={{ padding: '6px 12px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <ShieldCheck size={12} /> Scan & Install
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
