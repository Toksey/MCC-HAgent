'use client';

import { useState } from 'react';
import { Store, Coffee, Mail, Calendar, Check, Loader2, Sparkles, Smartphone, Search, Newspaper, Clock, FileText } from 'lucide-react';

const PLAYBOOKS = [
  {
    id: 'morning-briefing',
    title: 'Morning Briefing',
    description: 'Scans your calendar and pending tickets at 8:00 AM every day, and delivers a concise summary to your WhatsApp.',
    icon: Coffee,
    color: '#F59E0B',
    cron: '0 8 * * *',
    fields: ['contactNumber', 'agentId'],
    taskPrompt: 'Good morning. Please check my calendar and any pending tickets. Then send a summary format strictly via the whatsapp channel to {contactNumber}.',
  },
  {
    id: 'inbox-sweep',
    title: 'Inbox Sweep',
    description: 'Automatically reads unread emails, labels newsletters, deletes spam, and summarizes urgent messages every evening.',
    icon: Mail,
    color: '#3B82F6',
    cron: '0 18 * * *',
    fields: ['agentId'],
    taskPrompt: 'Review all unread emails. Delete spam, label newsletters, and summarize any urgent emails directly.',
  },
  {
    id: 'social-queue',
    title: 'Social Media Queue',
    description: 'Drafts a social media post idea based on recent industry news and saves it to your workspace daily at 10 AM.',
    icon: Sparkles,
    color: '#8B5CF6',
    cron: '0 10 * * *',
    fields: ['agentId'],
    taskPrompt: 'Draft a social media post idea based on recent industry news and save it to the workspace.',
  },
  {
    id: 'weekly-researcher',
    title: 'Weekly Subject Researcher',
    description: 'Searches online for particular news on a specific subject and keeps a running tab on it every Monday.',
    icon: Search,
    color: '#10B981',
    cron: '0 9 * * 1',
    fields: ['agentId'],
    taskPrompt: 'Search the web for the latest developments regarding [INSERT SUBJECT HERE]. Summarize the findings and append them to the subject dossier document.',
  },
  {
    id: 'newsletter-developer',
    title: 'Newsletter Developer',
    description: 'Researches hot topics and compiles the initial draft for your weekly newsletter.',
    icon: Newspaper,
    color: '#EC4899',
    cron: '0 10 * * 5',
    fields: ['agentId'],
    taskPrompt: 'Compile a newsletter draft. Find the top 3 industry stories of the week, write brief commentaries on each, and output a complete markdown newsletter into the workspace.',
  }
];

export default function PlaybooksPage() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState({ contactNumber: '', agentId: 'primary', prompt: '', cron: '' });
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState<string[]>([]);

  const handleOpenPlaybook = (playbook: any) => {
    setSelectedPlaybook(playbook.id);
    setFormConfig({
      contactNumber: '',
      agentId: 'primary',
      prompt: playbook.taskPrompt,
      cron: playbook.cron
    });
  };

  const handleInstall = async () => {
    if (!selectedPlaybook) return;
    setInstalling(true);
    const playbook = PLAYBOOKS.find(p => p.id === selectedPlaybook);
    
    await fetch('/api/playbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formConfig,
        id: selectedPlaybook,
        cronExpression: formConfig.cron,
        prompt: formConfig.prompt.replace('{contactNumber}', formConfig.contactNumber),
      }),
    });
    
    setTimeout(() => {
      setInstalling(false);
      setInstalled([...installed, selectedPlaybook]);
      setSelectedPlaybook(null);
      setFormConfig({ contactNumber: '', agentId: 'primary', prompt: '', cron: '' });
    }, 1500);
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={24} color="var(--accent-primary)" />
          Playbooks Marketplace
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
          One-click install automated agent workflows and scheduled tasks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {PLAYBOOKS.map((playbook) => {
          const Icon = playbook.icon;
          const isInstalled = installed.includes(playbook.id);

          return (
            <div key={playbook.id} className="glass-card-static" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${playbook.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={playbook.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{playbook.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Calendar size={12} /> {playbook.cron} 
                  </div>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: '0 0 20px 0' }}>
                {playbook.description}
              </p>

              <button
                onClick={() => isInstalled ? null : handleOpenPlaybook(playbook)}
                disabled={isInstalled}
                style={{
                  width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: isInstalled ? 'var(--status-success)20' : 'var(--accent-subtle)',
                  color: isInstalled ? 'var(--status-success)' : 'var(--accent-primary)',
                  fontWeight: 600, fontSize: '13px', cursor: isInstalled ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {isInstalled ? <><Check size={16} /> Installed</> : 'Install Workflow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Config Modal */}
      {selectedPlaybook && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="glass-card" style={{ width: '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Configure Playbook</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                Set up the parameters for <strong>{PLAYBOOKS.find(p => p.id === selectedPlaybook)?.title}</strong>.
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <Clock size={14} /> Cron Schedule
              </label>
              <input 
                value={formConfig.cron}
                onChange={e => setFormConfig({...formConfig, cron: e.target.value})}
                placeholder="0 8 * * *" 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <FileText size={14} /> Task Execution Prompt
              </label>
              <textarea 
                value={formConfig.prompt}
                onChange={e => setFormConfig({...formConfig, prompt: e.target.value})}
                style={{ width: '100%', minHeight: '140px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
              />
            </div>

            {PLAYBOOKS.find(p => p.id === selectedPlaybook)?.fields.includes('contactNumber') && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Smartphone size={14} /> WhatsApp Target Number
                </label>
                <input 
                  value={formConfig.contactNumber}
                  onChange={e => setFormConfig({...formConfig, contactNumber: e.target.value})}
                  placeholder="+1234567890" 
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
            
            {PLAYBOOKS.find(p => p.id === selectedPlaybook)?.fields.includes('agentId') && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Sparkles size={14} /> Assigned Agent
                </label>
                <select 
                  value={formConfig.agentId}
                  onChange={e => setFormConfig({...formConfig, agentId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', appearance: 'none' }}
                >
                  <option value="primary">Primary Agent (Default)</option>
                  <option value="analyst">Data Analyst</option>
                  <option value="scheduler">Scheduler Bot</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => setSelectedPlaybook(null)} disabled={installing} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleInstall} disabled={installing} style={{ flex: 2, padding: '10px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: installing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                {installing ? <><Loader2 size={16} className="spin" /> Deploying Payload…</> : 'Deploy Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
