'use client';

import { useState, useEffect } from 'react';
import { Store, Download, Upload, Package, Bot, Repeat, Wrench, Shield, Zap, Search, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'productivity' | 'research' | 'communication' | 'ops' | 'custom';
  agents?: number;
  routines?: number;
  skills?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
}

const MARKETPLACE_TEMPLATES: PlaybookTemplate[] = [
  { id: 'morning-briefing', name: 'Morning Briefing', description: 'Daily summary of calendar, tasks, and news delivered to your channel.', emoji: '🌅', category: 'productivity', agents: 1, routines: 1, skills: 2, difficulty: 'beginner', author: 'Ares Command' },
  { id: 'inbox-sweep', name: 'Inbox Sweep', description: 'Triage unread messages, draft replies, and flag urgent items.', emoji: '📧', category: 'communication', agents: 1, routines: 1, skills: 3, difficulty: 'intermediate', author: 'Ares Command' },
  { id: 'weekly-researcher', name: 'Weekly Researcher', description: 'Search the web weekly for a subject you track and compile findings.', emoji: '🔬', category: 'research', agents: 1, routines: 1, skills: 2, difficulty: 'beginner', author: 'Ares Command' },
  { id: 'newsletter-dev', name: 'Newsletter Developer', description: 'Compile research, draft a newsletter, and format for distribution.', emoji: '📰', category: 'communication', agents: 1, routines: 2, skills: 4, difficulty: 'advanced', author: 'Ares Command' },
  { id: 'social-queue', name: 'Social Media Queue', description: 'Generate and schedule social media posts across platforms.', emoji: '📱', category: 'communication', agents: 1, routines: 1, skills: 2, difficulty: 'intermediate', author: 'Ares Command' },
  { id: 'code-review', name: 'Code Review Assistant', description: 'Monitor repos, review PRs, and summarize changes for team leads.', emoji: '🔍', category: 'ops', agents: 2, routines: 1, skills: 5, difficulty: 'advanced', author: 'Community' },
  { id: 'standup-bot', name: 'Standup Bot', description: 'Collect team standup updates daily and post a summary.', emoji: '🤝', category: 'productivity', agents: 1, routines: 1, skills: 1, difficulty: 'beginner', author: 'Community' },
  { id: 'expense-tracker', name: 'Expense Tracker', description: 'Parse receipts, categorize expenses, and generate monthly reports.', emoji: '💰', category: 'ops', agents: 1, routines: 2, skills: 3, difficulty: 'intermediate', author: 'Community' },
  { id: 'onboarding-kit', name: 'New Hire Onboarding', description: 'Setup checklist, welcome docs, and day-1 briefing for new team members.', emoji: '🎒', category: 'ops', agents: 2, routines: 3, skills: 4, difficulty: 'advanced', author: 'Ares Command' },
];

const categoryColors: Record<string, string> = {
  productivity: '#10B981',
  research: '#6366F1',
  communication: '#3B82F6',
  ops: '#F59E0B',
  custom: '#8B5CF6',
};

const difficultyLabels: Record<string, { color: string; bg: string }> = {
  beginner: { color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  intermediate: { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  advanced: { color: 'var(--status-error)', bg: 'var(--status-error-bg)' },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  const filtered = MARKETPLACE_TEMPLATES.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...Array.from(new Set(MARKETPLACE_TEMPLATES.map((t) => t.category)))];

  const handleInstall = async (template: PlaybookTemplate) => {
    setInstalling(true);
    // Simulate installation
    await new Promise((r) => setTimeout(r, 1200));
    setInstalled((prev) => new Set([...prev, template.id]));
    setInstalling(false);
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Marketplace</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '6px 0 0 0' }}>
            Pre-built workflows, playbooks, and company templates
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px',
          }}>
            <Upload size={14} /> Import
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px',
          }}>
            <Download size={14} /> Export Company
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playbooks…"
            style={{
              width: '100%', padding: '8px 12px 8px 34px', background: 'var(--bg-input)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: selectedCategory === cat ? 'var(--accent-subtle)' : 'transparent',
                color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template detail drawer */}
      {selectedTemplate && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', borderColor: 'var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ fontSize: '32px' }}>{selectedTemplate.emoji}</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTemplate.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>by {selectedTemplate.author || 'Unknown'}</div>
              </div>
            </div>
            <button onClick={() => setSelectedTemplate(null)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
              Close
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '16px 0', lineHeight: 1.6 }}>{selectedTemplate.description}</p>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            {selectedTemplate.agents && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Bot size={12} /> {selectedTemplate.agents} agent{selectedTemplate.agents > 1 ? 's' : ''}</div>}
            {selectedTemplate.routines && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat size={12} /> {selectedTemplate.routines} routine{selectedTemplate.routines > 1 ? 's' : ''}</div>}
            {selectedTemplate.skills && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Wrench size={12} /> {selectedTemplate.skills} skill{selectedTemplate.skills > 1 ? 's' : ''}</div>}
          </div>
          <button
            onClick={() => handleInstall(selectedTemplate)}
            disabled={installing || installed.has(selectedTemplate.id)}
            style={{
              padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px',
              background: installed.has(selectedTemplate.id) ? 'var(--status-success-bg)' : 'var(--accent-gradient)',
              border: installed.has(selectedTemplate.id) ? '1px solid var(--status-success)' : 'none',
              borderRadius: 'var(--radius-md)', color: installed.has(selectedTemplate.id) ? 'var(--status-success)' : '#fff',
              fontSize: '13px', fontWeight: 600, cursor: installing ? 'wait' : 'pointer',
              opacity: installing ? 0.6 : 1,
            }}
          >
            {installed.has(selectedTemplate.id) ? <><CheckCircle2 size={16} /> Installed</> : installing ? 'Installing…' : <><Package size={16} /> Install Playbook</>}
          </button>
        </div>
      )}

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {filtered.map((template) => {
          const diff = difficultyLabels[template.difficulty];
          return (
            <div
              key={template.id}
              className="glass-card-link"
              onClick={() => setSelectedTemplate(template)}
              style={{ padding: '18px', cursor: 'pointer', position: 'relative' }}
            >
              {installed.has(template.id) && (
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--status-success)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '24px' }}>{template.emoji}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{template.name}</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
                      color: categoryColors[template.category] || '#888',
                      background: `${categoryColors[template.category] || '#888'}15`,
                      textTransform: 'uppercase',
                    }}>
                      {template.category}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
                      color: diff.color, background: diff.bg,
                    }}>
                      {template.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                {template.description}
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {template.agents && <span><Bot size={10} style={{ verticalAlign: 'middle' }} /> {template.agents}</span>}
                {template.routines && <span><Repeat size={10} style={{ verticalAlign: 'middle' }} /> {template.routines}</span>}
                {template.skills && <span><Wrench size={10} style={{ verticalAlign: 'middle' }} /> {template.skills}</span>}
                <span style={{ marginLeft: 'auto', fontSize: '10px' }}>{template.author}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
