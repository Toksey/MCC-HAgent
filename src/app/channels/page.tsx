'use client';

import { useState, useEffect } from 'react';
import { Radio, MessageCircle, Wifi, WifiOff, AlertCircle, Clock, Phone, User, Shield, Trash2, Plus, Loader2 } from 'lucide-react';
import { relativeTime } from '@/lib/parsers';

interface Contact {
  number: string;
  label: string;
  isOwner: boolean;
}

interface WhatsAppConfig {
  enabled: boolean;
  dmPolicy: string;
  selfChatMode: boolean;
  groupPolicy: string;
  contacts: Contact[];
  allowFrom: string[];
  debounceMs: number;
  mediaMaxMb: number;
}

interface TelegramConfig {
  enabled: boolean;
  dmPolicy: string;
  streaming: string;
  groupPolicy: string;
}

interface QueueItem {
  id: string;
  channel: string;
  to: string;
  enqueuedAt: number;
  lastError: string | null;
  retryCount: number;
  payloadPreview: string;
}

interface ChannelsData {
  channels: {
    whatsapp: WhatsAppConfig;
    telegram: TelegramConfig;
  };
  queue: QueueItem[];
  summary: {
    queueTotal: number;
    queueByChannel: Record<string, number>;
  };
}

function formatPhone(number: string): string {
  // Format +2348033812632 → +234 803 381 2632
  if (number.startsWith('+234')) {
    return `+234 ${number.slice(4, 7)} ${number.slice(7, 10)} ${number.slice(10)}`;
  }
  return number;
}

function PolicyBadge({ policy }: { policy: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    allowlist: { bg: 'var(--accent-subtle)', color: 'var(--accent-primary)' },
    pairing: { bg: '#7C3AED15', color: '#7C3AED' },
    open: { bg: 'var(--status-success)15', color: 'var(--status-success)' },
  };
  const style = colors[policy] || colors.open;
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
      background: style.bg, color: style.color, fontWeight: 600,
    }}>
      {policy.toUpperCase()}
    </span>
  );
}

export default function ChannelsPage() {
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueTab, setQueueTab] = useState<'all' | 'whatsapp' | 'telegram'>('all');
  const [newContact, setNewContact] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchChannels = () => {
    fetch('/api/channels').then(r => r.json()).then(d => { setData(d); setLoading(false); setUpdating(false); });
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleUpdateAllowlist = async (newList: string[]) => {
    setUpdating(true);
    await fetch('/api/channels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: { allowFrom: newList } }),
    });
    fetchChannels();
  };

  const handleAddContact = () => {
    if (!newContact.trim() || !data) return;
    let number = newContact.trim();
    if (!number.startsWith('+')) number = '+' + number;
    const current = data.channels.whatsapp.allowFrom || [];
    if (!current.includes(number)) {
      handleUpdateAllowlist([...current, number]);
    }
    setNewContact('');
  };

  const handleRemoveContact = (number: string) => {
    if (!data) return;
    const current = data.channels.whatsapp.allowFrom || [];
    handleUpdateAllowlist(current.filter(n => n !== number));
  };

  const wa = data?.channels.whatsapp;
  const tg = data?.channels.telegram;
  const filteredQueue = (data?.queue || []).filter(item =>
    queueTab === 'all' ? true : item.channel === queueTab
  );

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Channels & Delivery
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '6px 0 0 0' }}>
          Communication channels and delivery queue
        </p>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          Loading channels…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Channel cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* WhatsApp Card */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: '#25D36615', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '22px',
                }}>
                  💬
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp</span>
                    {wa?.enabled
                      ? <span className="badge badge-success">Enabled</span>
                      : <span className="badge badge-error">Disabled</span>
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Personal channel
                  </div>
                </div>
                {wa?.enabled ? <Wifi size={18} color="var(--status-success)" /> : <WifiOff size={18} color="var(--status-error)" />}
              </div>

              {/* Config rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '12px' }}>
                {[
                  { label: 'DM Policy', value: <PolicyBadge policy={wa?.dmPolicy || 'allowlist'} /> },
                  { label: 'Group Policy', value: <PolicyBadge policy={wa?.groupPolicy || 'allowlist'} /> },
                  { label: 'Self-Chat Mode', value: wa?.selfChatMode ? <span style={{ color: 'var(--status-success)' }}>On</span> : 'Off' },
                  { label: 'Media Limit', value: `${wa?.mediaMaxMb || 50} MB` },
                  { label: 'Debounce', value: `${wa?.debounceMs || 0}ms` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Allowed contacts */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
                }}>
                  <Shield size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Allowlist ({wa?.contacts.length || 0} contacts)
                  </span>
                  {updating && <Loader2 size={12} className="spin" style={{ color: 'var(--text-muted)' }} />}
                </div>
                
                {/* Add new contact */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input 
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    placeholder="Add number (e.g. +1234567890)" 
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '12px' }}
                    disabled={updating}
                  />
                  <button 
                    onClick={handleAddContact}
                    disabled={updating || !newContact.trim()}
                    style={{ padding: '8px 12px', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', cursor: (updating || !newContact.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: (updating || !newContact.trim()) ? 0.6 : 1 }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wa?.contacts.map(contact => (
                    <div
                      key={contact.number}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: contact.isOwner ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: contact.isOwner ? 'var(--accent-primary)' : 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: contact.isOwner ? '14px' : '16px',
                        flexShrink: 0,
                      }}>
                        {contact.isOwner ? '👑' : <User size={14} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {contact.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {formatPhone(contact.number)}
                        </div>
                      </div>
                      {contact.isOwner ? (
                        <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontSize: '9px' }}>
                          Owner
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleRemoveContact(contact.number)}
                          disabled={updating}
                          style={{ background: 'transparent', border: 'none', color: 'var(--status-error)', cursor: updating ? 'not-allowed' : 'pointer', padding: '4px', opacity: updating ? 0.5 : 1 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!wa?.contacts || wa.contacts.length === 0) && (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No contacts configured
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Telegram Card */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: '#2CA5E015', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '22px',
                }}>
                  ✈️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Telegram</span>
                    {tg?.enabled
                      ? <span className="badge badge-success">Enabled</span>
                      : <span className="badge badge-error">Disabled</span>
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Backup channel</div>
                </div>
                {tg?.enabled ? <Wifi size={18} color="var(--status-success)" /> : <WifiOff size={18} color="var(--status-error)" />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {[
                  { label: 'DM Policy', value: <PolicyBadge policy={tg?.dmPolicy || 'pairing'} /> },
                  { label: 'Group Policy', value: <PolicyBadge policy={tg?.groupPolicy || 'allowlist'} /> },
                  { label: 'Streaming', value: tg?.streaming || 'partial' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Note about pairing policy */}
              <div style={{
                marginTop: '20px', padding: '12px', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)',
                fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Pairing mode:</strong> Only paired Telegram accounts can message the primary agent. No allowlist required — authentication is device-based.
              </div>

              {/* Queue summary for Telegram */}
              {data?.summary.queueByChannel.telegram && (
                <div style={{
                  marginTop: '16px', padding: '12px 14px',
                  background: '#EF444415', borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <AlertCircle size={14} color="var(--status-error)" />
                  <span style={{ fontSize: '12px', color: 'var(--status-error)' }}>
                    {data.summary.queueByChannel.telegram} pending in delivery queue
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Queue */}
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--status-warning)" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Delivery Queue
                </span>
                <span className="badge badge-warning">{data?.summary.queueTotal || 0} pending</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['all', 'whatsapp', 'telegram'] as const).map(t => (
                  <button key={t} onClick={() => setQueueTab(t)} style={{
                    padding: '4px 10px', fontSize: '11px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)', cursor: 'pointer',
                    background: queueTab === t ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    color: queueTab === t ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}>
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue explanation */}
            {(data?.summary.queueTotal || 0) > 0 && (
              <div style={{
                padding: '10px 12px', background: '#EF444412', borderRadius: 'var(--radius-md)',
                marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <AlertCircle size={12} style={{ display: 'inline', marginRight: '6px', color: 'var(--status-error)' }} />
                These messages failed to deliver because the WhatsApp Web listener is offline.
                Start the gateway with <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: '3px' }}>openclaw gateway</code> and link WhatsApp to clear the queue.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {filteredQueue.slice(0, 15).map(item => (
                <div key={item.id} style={{
                  padding: '12px 14px', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{item.channel === 'whatsapp' ? '💬' : '✈️'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      To: {item.channel === 'whatsapp' ? formatPhone(item.to) : item.to}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {item.enqueuedAt ? relativeTime(item.enqueuedAt) : ''}
                    </span>
                    {item.retryCount > 0 && (
                      <span className="badge badge-error" style={{ fontSize: '9px' }}>{item.retryCount} retries</span>
                    )}
                  </div>
                  {item.payloadPreview && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                      {item.payloadPreview}{item.payloadPreview.length >= 100 ? '…' : ''}
                    </div>
                  )}
                </div>
              ))}
              {filteredQueue.length > 15 && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '8px' }}>
                  +{filteredQueue.length - 15} more items
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
