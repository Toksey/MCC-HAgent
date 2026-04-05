'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Bot,
  Brain,
  Wrench,
  Clock,
  Radio,
  FolderOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Hammer,
  Server,
  Puzzle,
  Settings,
  Store,
  Moon,
  Sun,
  Coffee,
  Inbox,
  Repeat,
  BarChart3,
  Zap,
  ChevronsUpDown,
  Plus,
  Database,
  Activity,
  Target,
  Shield,
} from 'lucide-react';
import Image from 'next/image';

// ── Grouped navigation ──────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: 'new';
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: '/team', label: 'Team', icon: Bot },
      { href: '/chat', label: 'Chat', icon: MessageSquare },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [
      { href: '/tasks', label: 'Task Board', icon: ClipboardList },
      { href: '/calendar', label: 'Calendar', icon: Clock },
      { href: '/playbooks', label: 'Playbooks', icon: Repeat, badge: 'new' },
      { href: '/office', label: 'Office', icon: Building2 },
    ],
  },
  {
    id: 'cognitive',
    label: 'Cognitive',
    items: [
      { href: '/goals', label: 'Goals', icon: Target, badge: 'new' },
      { href: '/loop', label: 'Loop Monitor', icon: Activity, badge: 'new' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { href: '/memories', label: 'Memory', icon: Brain },
      { href: '/documents', label: 'Documents', icon: FolderOpen },
      { href: '/forge', label: 'The Forge', icon: Hammer },
      { href: '/skills', label: 'Skills & MCP', icon: Wrench },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    items: [
      { href: '/models', label: 'Models', icon: Database },
      { href: '/protocols', label: 'Protocols', icon: Server },
      { href: '/channels', label: 'Channels', icon: Radio },
      { href: '/plugins', label: 'Plugins', icon: Puzzle },
      { href: '/security', label: 'Security', icon: Shield, badge: 'new' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/setup', label: 'Setup', icon: Wrench },
    ],
  },
];

// ── Company type (inline for sidebar) ────────────────────────────
interface CompanyMini {
  id: string;
  name: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  // Group expand states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('mc-sidebar-sections');
    if (saved) {
      try {
        setExpandedGroups(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    
    // Default: all closed EXCEPT the one containing the active route
    const defaultState: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      const hasActive = g.items.some(
        (item) => item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
      );
      defaultState[g.id] = hasActive;
    });
    setExpandedGroups(defaultState);
  }, [pathname]);

  // Company switcher
  const [companies, setCompanies] = useState<CompanyMini[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((d) => {
        setCompanies(d.companies || []);
        setActiveCompanyId(d.activeCompanyId || null);
      })
      .catch(() => {});
  }, []);

  const activeCompany = companies.find((c) => c.id === activeCompanyId);

  const switchCompany = async (id: string) => {
    try {
      await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ switchTo: id }),
      });
      setActiveCompanyId(id);
      setShowCompanyPicker(false);
      window.location.reload();
    } catch {}
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      localStorage.setItem('mc-sidebar-sections', JSON.stringify(next));
      return next;
    });
  };

  const handleThemeChange = (t: 'dark' | 'light' | 'maroon') => {
    setTheme(t);
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        transition: 'width var(--transition-default), min-width var(--transition-default)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 14px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          minHeight: '72px',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Image src="/logo.png" alt="Hermes Command" width={32} height={32} style={{ objectFit: 'contain' }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Hermes Command
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              Cognitive Control
            </div>
          </div>
        )}
      </div>

      {/* Company Switcher */}
      {!collapsed && companies.length > 0 && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setShowCompanyPicker(!showCompanyPicker)}
            style={{
              width: '100%',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeCompany?.name || 'Select Company'}
            </span>
            <ChevronsUpDown size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
          </button>

          {showCompanyPicker && (
            <div
              style={{
                marginTop: '4px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              {companies.map((co) => (
                <button
                  key={co.id}
                  onClick={() => switchCompany(co.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: co.id === activeCompanyId ? 'var(--accent-subtle)' : 'transparent',
                    border: 'none',
                    color: co.id === activeCompanyId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: co.id === activeCompanyId ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      co.id === activeCompanyId ? 'var(--accent-subtle)' : 'transparent';
                  }}
                >
                  {co.name}
                </button>
              ))}
              <Link
                href="/companies"
                onClick={() => setShowCompanyPicker(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                  fontSize: '11px',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                <Plus size={12} /> Manage Companies
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation Groups */}
      <nav
        style={{
          flex: 1,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="feed-scroll"
      >
        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.id];
          const hasActiveItem = group.items.some(
            (item) =>
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href),
          );

          return (
            <div key={group.id} style={{ marginBottom: '4px' }}>
              {/* Group header */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: hasActiveItem ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = hasActiveItem
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)';
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform var(--transition-fast)',
                    }}
                  />
                </button>
              )}

              {/* Group items */}
              {(collapsed || isExpanded) &&
                group.items.map(({ href, label, icon: Icon, badge }) => {
                  const isActive =
                    href === '/' ? pathname === '/' : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: collapsed ? '10px 14px' : '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                        background: isActive
                          ? 'var(--accent-subtle)'
                          : 'transparent',
                        transition: 'all var(--transition-fast)',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            'var(--bg-card-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Icon
                        size={17}
                        style={{
                          flexShrink: 0,
                          color: isActive ? 'var(--accent-primary)' : 'inherit',
                        }}
                      />
                      {!collapsed && (
                        <>
                          <span>{label}</span>
                          {badge === 'new' && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                fontSize: '9px',
                                fontWeight: 700,
                                color: 'var(--status-info)',
                                background: 'var(--status-info-bg)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                letterSpacing: '0.04em',
                              }}
                            >
                              NEW
                            </span>
                          )}
                        </>
                      )}
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3,
                            height: 18,
                            borderRadius: '0 3px 3px 0',
                            background: 'var(--accent-primary)',
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div
        style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '4px',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexDirection: collapsed ? 'column' : 'row',
        }}
      >
        {[
          { id: '', icon: Moon, label: 'Dark' },
          { id: 'light', icon: Sun, label: 'Light' },
          { id: 'maroon', icon: Coffee, label: 'Espresso' },
        ].map((t) => {
          const isActive = theme === (t.id || 'dark');
          return (
            <button
              key={t.id || 'dark'}
              onClick={() => handleThemeChange((t.id || 'dark') as any)}
              title={t.label}
              style={{
                flex: 1,
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: isActive
                  ? 'var(--accent-primary)'
                  : 'var(--text-tertiary)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <t.icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div
        style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '10px 14px',
            width: '100%',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card-hover)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
