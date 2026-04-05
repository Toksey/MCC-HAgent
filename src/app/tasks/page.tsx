'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, X, ChevronDown, Circle, AlertCircle, AlertTriangle, Minus, Flag, Bot, Paperclip, Upload } from 'lucide-react';
import { relativeTime } from '@/lib/parsers';

type Status = 'backlog' | 'in-progress' | 'review' | 'done';
type Priority = 'critical' | 'high' | 'normal' | 'low';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  agentId?: string;
  estimate?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AgentInfo { id: string; name: string; emoji: string; }

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--status-info)' },
  { id: 'review', label: 'Review', color: 'var(--status-warning)' },
  { id: 'done', label: 'Done', color: 'var(--status-success)' },
];

const PRIORITY_CONFIG: Record<Priority, { icon: React.ReactNode; color: string; label: string }> = {
  critical: { icon: <AlertCircle size={11} />, color: 'var(--status-error)', label: 'Critical' },
  high: { icon: <AlertTriangle size={11} />, color: 'var(--status-warning)', label: 'High' },
  normal: { icon: <Minus size={11} />, color: 'var(--text-tertiary)', label: 'Normal' },
  low: { icon: <Circle size={11} />, color: 'var(--text-muted)', label: 'Low' },
};

function TaskCard({
  task,
  onMove,
  onDelete,
  agents,
}: {
  task: Task;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  agents: AgentInfo[];
}) {
  const p = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG['normal'];
  const agent = agents.find(a => a.id === task.agentId);
  const statuses = COLUMNS.map(c => c.id).filter(s => s !== task.status);

  return (
    <div
      className="glass-card"
      style={{ padding: '14px', marginBottom: '10px', cursor: 'pointer', transition: 'box-shadow var(--transition-fast)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      onClick={() => onMove(task.id, task.status)} // placeholder to pass click, we will pass onEdit
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.color, flexShrink: 0, marginTop: '2px' }}>
          {p.icon}
        </div>
        <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.4' }}>
          {task.title}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      </div>

      {task.description && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.6', marginBottom: '10px' }}>
          {task.description.slice(0, 100)}{task.description.length > 100 ? '…' : ''}
        </div>
      )}

      {task.labels && task.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {task.labels.map(l => (
            <span key={l} style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', borderRadius: '99px', fontWeight: 600 }}>{l}</span>
          ))}
        </div>
      )}

      {task.estimate && (
        <div style={{ display: 'inline-block', fontSize: '10px', padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          ⏱ {task.estimate}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {agent && (
            <span style={{ fontSize: '12px' }} title={agent.name}>{agent.emoji}</span>
          )}
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{relativeTime(task.createdAt)}</span>
        </div>

        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={e => onMove(task.id, e.target.value as Status)}
            style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function TaskEditModal({ task, onSave, onClose, agents }: { task: Task; onSave: (t: Task) => void; onClose: () => void; agents: AgentInfo[] }) {
  const [edited, setEdited] = useState<Task>(task);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/attachments?taskId=${task.id}`)
      .then(r => r.json())
      .then(d => setAttachments(d.attachments || []))
      .catch(() => {});
  }, [task.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', task.id);
      try {
        const res = await fetch('/api/tasks/attachments', { method: 'POST', body: formData });
        if (res.ok) {
          const d = await res.json();
          setAttachments(prev => [...prev, d.attachment]);
        }
      } catch { /* */ }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteAttachment = async (file: string) => {
    await fetch(`/api/tasks/attachments?taskId=${task.id}&file=${file}`, { method: 'DELETE' });
    setAttachments(prev => prev.filter(a => a.storedAs !== file));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="glass-card" style={{ width: '650px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>🎫 {task.id.slice(0, 8).toUpperCase()}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Title</label>
            <input value={edited.title} onChange={e => setEdited({...edited, title: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
              <select value={edited.status} onChange={e => setEdited({...edited, status: e.target.value as Status})} style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Priority</label>
              <select value={edited.priority} onChange={e => setEdited({...edited, priority: e.target.value as Priority})} style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assignee</label>
              <select value={edited.agentId} onChange={e => setEdited({...edited, agentId: e.target.value})} style={{ width: '100%', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}>
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Estimate (Story Points/Time)</label>
            <input value={edited.estimate || ''} placeholder="e.g. 3 SP, 2 hours" onChange={e => setEdited({...edited, estimate: e.target.value})} style={{ width: '50%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
          </div>

          <div style={{ flex: 1, minHeight: '140px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description (Markdown Supported)</label>
            <textarea value={edited.description || ''} onChange={e => setEdited({...edited, description: e.target.value})} style={{ width: '100%', flex: 1, padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Labels (comma-separated)</label>
            <input value={(edited.labels || []).join(', ')} onChange={e => setEdited({...edited, labels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} placeholder="bug, frontend, urgent" style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
          </div>

          {/* Attachments Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={12} /> Attachments ({attachments.length})
              </div>
              <label style={{
                padding: '5px 10px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600,
                cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                opacity: uploading ? 0.6 : 1,
              }}>
                <Upload size={12} /> {uploading ? 'Uploading…' : 'Add File'}
                <input ref={fileInputRef} type="file" multiple accept="image/*,audio/*" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {attachments.map((att: any) => (
                  <div key={att.id} style={{
                    position: 'relative', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)', overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                  }}>
                    {att.category === 'image' ? (
                      <img
                        src={att.url}
                        alt={att.filename}
                        style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: 160, padding: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🎵 {att.filename}
                        </div>
                        <audio controls src={att.url} style={{ width: '100%', height: '24px' }} />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAttachment(att.storedAs); }}
                      style={{
                        position: 'absolute', top: '2px', right: '2px', width: 16, height: 16,
                        borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none',
                        color: '#fff', fontSize: '10px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Supports images (JPEG, PNG, GIF, WebP) and audio (MP3, WAV, OGG, FLAC). Max 10MB per file.
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activity Notes</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '8px' }}>Created {new Date(task.createdAt).toLocaleString()}</div>
              {task.updatedAt !== task.createdAt && <div>Last updated {new Date(task.updatedAt).toLocaleString()}</div>}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-surface)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={() => onSave(edited)} style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}


function NewTaskForm({ onSubmit, onCancel, agents }: {
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  agents: AgentInfo[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [agentId, setAgentId] = useState('main');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, priority, agentId, status: 'backlog' });
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--bg-card)', border: '1px solid var(--accent-primary)',
      borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px',
    }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title…"
        style={{
          width: '100%', padding: '8px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
          marginBottom: '8px', boxSizing: 'border-box',
        }}
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        style={{
          width: '100%', padding: '8px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)', fontSize: '12px', outline: 'none', resize: 'none',
          marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          style={{
            flex: 1, padding: '6px 8px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)', fontSize: '12px',
          }}
        >
          <option value="critical">🔴 Critical</option>
          <option value="high">🟡 High</option>
          <option value="normal">⚪ Normal</option>
          <option value="low">🔵 Low</option>
        </select>
        <select
          value={agentId}
          onChange={e => setAgentId(e.target.value)}
          style={{
            flex: 1, padding: '6px 8px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)', fontSize: '12px',
          }}
        >
          {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button" onClick={onCancel}
          style={{
            padding: '7px 14px', background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '7px 14px', background: 'var(--accent-primary)', border: 'none',
            borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '12px', cursor: 'pointer',
          }}
        >
          Add Task
        </button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterAgent, setFilterAgent] = useState('');

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => { setTasks(d.tasks || []); setLoading(false); });
    fetch('/api/agents').then(r => r.json()).then(d => {
      if (d.agents) {
        setAgents(d.agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          emoji: a.emoji,
        })));
      }
    });
  }, []);

  const addTask = async (data: Partial<Task>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
    setShowNewForm(false);
  };

  const moveTask = async (id: string, status: Status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
    });
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  };

  const saveTaskDetails = async (edited: Task) => {
    setTasks(prev => prev.map(t => t.id === edited.id ? edited : t));
    setSelectedTask(null);
    await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edited),
    });
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Task Board
          </h1>
           <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '6px', margin: '6px 0 0 0' }}>
            {tasks.length} tickets across all agents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            onChange={e => setFilterAgent(e.target.value)}
            style={{
              padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px',
            }}
          >
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
          </select>
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              background: 'var(--accent-gradient)', border: 'none',
              borderRadius: 'var(--radius-md)', color: 'white', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      {/* New task form (global) */}
      {showNewForm && (
        <NewTaskForm agents={agents} onSubmit={addTask} onCancel={() => setShowNewForm(false)} />
      )}

      {/* Detail Modal */}
      {selectedTask && (
        <TaskEditModal task={selectedTask} agents={agents} onSave={saveTaskDetails} onClose={() => setSelectedTask(null)} />
      )}

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          Loading tasks…
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', overflow: 'hidden' }}>
          {COLUMNS.map(col => {
            const filteredTasks = filterAgent ? tasks.filter(t => t.agentId === filterAgent) : tasks;
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                  padding: '0 4px', flexShrink: 0,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{col.label}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '11px', fontWeight: 600, padding: '2px 7px',
                    borderRadius: '99px', background: 'var(--bg-elevated)', color: 'var(--text-tertiary)',
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="feed-scroll" style={{ flex: 1, overflowY: 'auto', padding: '2px' }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)',
                      height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', fontSize: '12px',
                    }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map(t => (
                      <div key={t.id} onClick={() => setSelectedTask(t)}>
                        <TaskCard task={t} onMove={moveTask} onDelete={deleteTask} agents={agents} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
