'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, FileText, File, Briefcase, ScrollText, ChevronRight, Eye, Sparkles, Loader2 } from 'lucide-react';

interface DocInfo {
  id: string;
  label: string;
  icon: string;
  exists: boolean;
  preview: string;
  charCount: number;
}

interface DocumentsData {
  docs: DocInfo[];
  projects: { name: string; type: string }[];
  proposals: { name: string; type: string }[];
}

export default function DocumentsPage() {
  const [data, setData] = useState<DocumentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardTarget, setWizardTarget] = useState('IDENTITY.md');
  const [wizardCustomFile, setWizardCustomFile] = useState('');
  const [wizardPrompt, setWizardPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  const loadDoc = async (id: string, label: string) => {
    setSelected({ id, label });
    setContentLoading(true);
    const res = await fetch(`/api/documents?file=${id}`);
    const d = await res.json();
    setContent(d.content || '');
    setContentLoading(false);
  };

  const generateMarkdown = async () => {
    if (!wizardPrompt.trim()) return;
    setGenerating(true);
    try {
      const finalTarget = wizardTarget === 'Custom' ? (wizardCustomFile.endsWith('.md') ? wizardCustomFile : wizardCustomFile + '.md') : wizardTarget;
      
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: finalTarget, prompt: wizardPrompt, agentContext: {} }),
      });
      const d = await res.json();
      
      if (d.content) {
        // Save the content
        await fetch('/api/documents', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ filename: finalTarget, content: d.content })
        });
        
        // Refresh docs list
        const refreshed = await fetch('/api/documents').then(r => r.json());
        setData(refreshed);
        setSelected({ id: finalTarget, label: finalTarget });
        setContent(d.content);
        
        setShowWizard(false);
        setWizardPrompt('');
      } else {
        alert('Generation failed or returned no content.');
      }
    } catch {
      alert('Network error while generating.');
    } finally {
      setGenerating(false);
    }
  };

  const renderMarkdown = (md: string) => md.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px' }}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '14px 0 6px' }}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', margin: '10px 0 4px' }}>{line.slice(4)}</h3>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginLeft: '16px' }}>{line.slice(2)}</li>;
    if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px', color: 'var(--text-tertiary)', fontSize: '13px', margin: '8px 0', fontStyle: 'italic' }}>{line.slice(2)}</blockquote>;
    if (line.trim() === '' || line === '---') return <div key={i} style={{ height: '8px' }} />;
    if (line.startsWith('```')) return <div key={i} style={{ height: '4px' }} />;
    return <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '3px 0' }}>{line}</p>;
  });

  return (
    <div className="page-enter" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px', minWidth: '240px', flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)', height: '100%', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Documents</span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => setShowWizard(true)} style={{ width: '100%', padding: '6px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}>
              <Sparkles size={12} /> MD Wizard
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Loading…</div>
        ) : (
          <>
            {/* Identity docs */}
            <div style={{ padding: '12px 14px 4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Identity Files
              </div>
            </div>
            {data?.docs.map(doc => (
              <button
                key={doc.id}
                onClick={() => loadDoc(doc.id, doc.label)}
                style={{
                  width: '100%', padding: '9px 14px', border: 'none',
                  background: selected?.id === doc.id ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => { if (selected?.id !== doc.id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={e => { if (selected?.id !== doc.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{doc.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: selected?.id === doc.id ? 'var(--accent-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.label}
                  </div>
                  {!doc.exists && <div style={{ fontSize: '10px', color: 'var(--status-error)' }}>Missing</div>}
                </div>
                {doc.exists && <ChevronRight size={12} color={selected?.id === doc.id ? 'var(--accent-primary)' : 'var(--text-muted)'} />}
              </button>
            ))}

            {/* Projects */}
            {(data?.projects?.length || 0) > 0 && (
              <>
                <div style={{ padding: '16px 14px 4px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Projects ({data?.projects.length})
                    </span>
                  </div>
                </div>
                {data?.projects.map(p => (
                  <div key={p.name} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 14px', fontSize: '12px', color: 'var(--text-secondary)',
                  }}>
                    <span>{p.type === 'dir' ? '📁' : '📄'}</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </>
            )}

            {/* Proposals */}
            {(data?.proposals?.length || 0) > 0 && (
              <>
                <div style={{ padding: '16px 14px 4px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ScrollText size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Proposals ({data?.proposals.length})
                    </span>
                  </div>
                </div>
                {data?.proposals.map(p => (
                  <div key={p.name} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 14px', fontSize: '12px', color: 'var(--text-secondary)',
                  }}>
                    <span>{p.name.endsWith('.md') ? '📝' : '📊'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderOpen size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px' }}>Select a document to preview</div>
              <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>Identity files, projects, and proposals</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-surface)', flexShrink: 0,
            }}>
              <FileText size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{selected.label}</span>
              <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                Read-only
              </span>
            </div>

            {/* Content */}
            <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '760px' }}>
              {contentLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
              ) : content ? (
                renderMarkdown(content)
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>File is empty or does not exist</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Wizard Modal */}
      {showWizard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-subtle)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <Sparkles size={24} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Universal Markdown Wizard</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Generate robust documents for OpenClaw using AI</div>
              </div>
            </div>

            {generating ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--accent-primary)' }}>
                <Loader2 size={32} className="spin" />
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Synthesizing Content…</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Document</label>
                  <select value={wizardTarget} onChange={e => setWizardTarget(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', appearance: 'none' }}>
                    <option value="IDENTITY.md">IDENTITY.md (Core agent identity)</option>
                    <option value="SOUL.md">SOUL.md (Deep behavioral parameters)</option>
                    <option value="SKILL.md">SKILL.md (Tool definitions)</option>
                    <option value="RULES.md">RULES.md (Hard guardrails)</option>
                    <option value="README.md">README.md (Project docs)</option>
                    <option value="Custom">Custom...</option>
                  </select>
                </div>
                
                {wizardTarget === 'Custom' && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Custom Filename</label>
                    <input value={wizardCustomFile} onChange={e => setWizardCustomFile(e.target.value)} placeholder="e.g. SYSTEM_DESIGN.md" style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Prompt / Context</label>
                  <textarea value={wizardPrompt} onChange={e => setWizardPrompt(e.target.value)} placeholder="Describe exactly what you want the AI to generate in this file. Be specific about constraints, formatting, or target goals..." style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', minHeight: '120px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => setShowWizard(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={!wizardPrompt} onClick={generateMarkdown} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: wizardPrompt ? 'pointer' : 'not-allowed', opacity: wizardPrompt ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Sparkles size={14} /> Generate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
