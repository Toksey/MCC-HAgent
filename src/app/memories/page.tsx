'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Search, Calendar as CalIcon, Edit3, Save, X, FileText, ChevronRight, Plus, Sparkles, Loader2, Database } from 'lucide-react';
import Link from 'next/link';
import { relativeTime } from '@/lib/parsers';

interface MemoryFile {
  filename: string;
  path: string;
  date?: string;
  category?: string;
  sizeBytes: number;
  modifiedAt: string;
}

interface MemoriesData {
  files: MemoryFile[];
  dailyFiles: MemoryFile[];
  categoryFiles: MemoryFile[];
  summary: {
    total: number;
    modifiedToday: number;
    dailyCount: number;
    categoryCount: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  'business-tasks': '📋 Business Tasks',
  'app-ideas': '💡 App Ideas',
  'customer-interactions': '🤝 Customer Interactions',
  'content-queue': '📢 Content Queue',
  'follow-ups': '🔔 Follow-Ups',
  'skill-gaps': '⚙️ Skill Gaps',
  'content-rejected': '❌ Rejected Content',
  'MEMORY': '🧠 Long-Term Memory',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export default function MemoriesPage() {
  const [data, setData] = useState<MemoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'daily' | 'categories'>('daily');
  
  // Simple Create State
  const [showCreate, setShowCreate] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/memories')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const loadFile = async (file: MemoryFile) => {
    setSelected(file);
    setContentLoading(true);
    setEditing(false);
    const res = await fetch(`/api/memories?file=${encodeURIComponent(file.filename)}`);
    const d = await res.json();
    setContent(d.content || '');
    setEditContent(d.content || '');
    setContentLoading(false);
  };

  const saveFile = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/memories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: selected.filename, content: editContent }),
    });
    setContent(editContent);
    setEditing(false);
    setSaving(false);
    // Refresh list if it might be new
    const res = await fetch('/api/memories');
    const d = await res.json();
    setData(d);
  };

  const handleCreateSimple = async () => {
    if (!newFileName.trim()) return;
    const name = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    setEditContent('# New Document\n\nWrite here...');
    setContent('# New Document\n\nWrite here...');
    setSelected({ filename: name, path: '', sizeBytes: 10, modifiedAt: new Date().toISOString() });
    setEditing(true);
    setShowCreate(false);
    setNewFileName('');
  };

  const allFiles = data?.files || [];
  const filtered = search
    ? allFiles.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()))
    : tab === 'daily' ? (data?.dailyFiles || []) : (data?.categoryFiles || []);

  const renderMarkdownSimple = (md: string) => {
    // Very lightweight markdown rendering for display
    return md
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px 0' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '14px 0 6px 0' }}>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', margin: '12px 0 4px 0' }}>{line.slice(4)}</h3>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginLeft: '16px' }}>{line.slice(2)}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px', color: 'var(--text-tertiary)', fontSize: '13px', margin: '8px 0', fontStyle: 'italic' }}>{line.slice(2)}</blockquote>;
        if (line.trim() === '' || line === '---') return <div key={i} style={{ height: '8px' }} />;
        return <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '4px 0' }}>{line}</p>;
      });
  };

  return (
    <div className="page-enter" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar — file list */}
      <div style={{
        width: '280px', minWidth: '240px', flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)', height: '100%',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Brain size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Memories</span>
            {data && <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{data.summary.total}</span>}
          </div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              style={{
                width: '100%', padding: '7px 10px 7px 28px', background: 'var(--bg-input)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCreate(true)} style={{ flex: 1, padding: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}>
              <Plus size={12} /> New Memory File
            </button>
            <Link href="/memory" style={{ flex: 1, padding: '6px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', fontWeight: 500 }}>
              <Database size={12} /> OpenBrain
            </Link>
          </div>
        </div>

        {/* Tabs */}
        {!search && (
          <div style={{ display: 'flex', padding: '8px 12px', gap: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
            {(['daily', 'categories'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '5px', borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                  background: tab === t ? 'var(--accent-subtle)' : 'transparent',
                  color: tab === t ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {t === 'daily' ? '📅 Daily' : '📁 Categories'}
              </button>
            ))}
          </div>
        )}

        {/* File list */}
        <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No files found</div>
          ) : (
            filtered.map(file => {
              const label = file.date
                ? new Date(file.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
                : CATEGORY_LABELS[file.filename.replace('.md', '')] || file.filename.replace('.md', '');
              const isSelected = selected?.filename === file.filename;
              const isToday = file.modifiedAt.split('T')[0] === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={file.filename}
                  onClick={() => loadFile(file)}
                  style={{
                    width: '100%', padding: '10px 10px', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <FileText size={13} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px', fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {label}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatBytes(file.sizeBytes)}</span>
                      {isToday && <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 5px' }}>Today</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Stats footer */}
        {data && (
          <div style={{
            padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px',
          }}>
            <span>📅 {data.summary.dailyCount} daily</span>
            <span>📁 {data.summary.categoryCount} categories</span>
            {data.summary.modifiedToday > 0 && <span style={{ color: 'var(--status-success)' }}>✓ {data.summary.modifiedToday} today</span>}
          </div>
        )}
      </div>

      {/* Main — file content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <Brain size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px' }}>Select a memory file to view</div>
            </div>
          </div>
        ) : (
          <>
            {/* File header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
              background: 'var(--bg-surface)',
            }}>
              <FileText size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {CATEGORY_LABELS[selected.filename.replace('.md', '')] || selected.filename}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {formatBytes(selected.sizeBytes)} · Modified {relativeTime(selected.modifiedAt)}
                </div>
              </div>
              {editing ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditing(false); setEditContent(content); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      background: 'transparent', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                    }}
                  >
                    <X size={13} /> Discard
                  </button>
                  <button
                    onClick={saveFile}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                      background: 'var(--accent-primary)', border: 'none',
                      borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '12px',
                      cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                    }}
                  >
                    <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  <Edit3 size={13} /> Edit
                </button>
              )}
            </div>

            {/* Content */}
            <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {contentLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading…</div>
              ) : editing ? (
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  style={{
                    width: '100%', minHeight: '500px', background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.7',
                    padding: '16px', fontFamily: 'var(--font-mono)', resize: 'vertical',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{ maxWidth: '760px' }}>
                  {renderMarkdownSimple(content)}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Simple Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '360px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>New Document</div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Filename</label>
              <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="e.g. project-x.md" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateSimple} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
