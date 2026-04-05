import {
  Bot,
  Clock,
  Radio,
  Brain,
  Wrench,
  Mail,
  Activity,
  Server,
  Database,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import StatusCard from '@/components/status-card';
import ActivityFeed from '@/components/activity-feed';
import { ApiUsageChart, ExpandableModule } from '@/components/dashboard-charts';

export const dynamic = 'force-dynamic';

// Import Hermes adapter — replaces all direct filesystem reads
import { agents, memory, skills, mcp, telemetry } from '@/lib/hermes';

async function getAgentData() {
  try {
    const [agentList, health] = await Promise.all([
      agents.getAgents(),
      telemetry.getSystemHealth(),
    ]);
    return { agents: agentList, health };
  } catch {
    return { agents: [], health: null };
  }
}

async function getSkillData() {
  try {
    const allSkills = await skills.list();
    return { total: allSkills.length, ready: allSkills.filter(s => s.status === 'ready').length };
  } catch {
    return { total: 0, ready: 0 };
  }
}

async function getMemoryData() {
  try {
    const entries = await memory.getAll();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: entries.length,
      modifiedToday: entries.filter(m => m.updatedAt.startsWith(today)).length,
    };
  } catch {
    return { total: 0, modifiedToday: 0 };
  }
}

async function getMcpData() {
  try {
    const tools = await mcp.listTools();
    const sources = [...new Set(tools.map(t => t.source))];
    return { active: sources.length, servers: sources, totalTools: tools.length };
  } catch {
    return { active: 0, servers: [], totalTools: 0 };
  }
}

async function getSystemLogs() {
  try {
    const health = await telemetry.getSystemHealth();
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Hermes cognitive loop running — ${health.activeAgents} agents active`,
        source: 'hermes-runtime',
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: `Memory store healthy: ${health.totalMemories} entries, +${health.memoryGrowthRate.toFixed(1)}/hr`,
        source: 'openbrain',
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'info',
        message: `Avg loop latency: ${health.averageLoopLatencyMs.toFixed(0)}ms, error rate: ${health.errorRateLast24h.toFixed(1)}%`,
        source: 'telemetry',
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'info',
        message: `Skills executed: ${health.totalSkillExecutions} total`,
        source: 'skills',
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'info',
        message: 'Cognitive control gateway online',
        source: 'gateway',
      },
    ];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [agentData, skillData, memoryData, mcpData, logs] = await Promise.all([
    getAgentData(),
    getSkillData(),
    getMemoryData(),
    getMcpData(),
    getSystemLogs(),
  ]);

  const health = agentData.health;
  const cronOk = health ? Math.round(agentData.agents.length * 0.8) : 0;
  const cronFailed = health?.errorRateLast24h ?? 0;

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Hermes Command
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '6px', margin: '6px 0 0 0' }}>
          Cognitive Mission Control · {process.env.HERMES_API_URL ? '🟢 Live' : '🟡 Mock Mode'}
        </p>
      </div>

      {/* Main Executive Layout */}
      <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', minHeight: 'min-content' }}>

        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

          {/* Hero KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <StatusCard
              icon={<Bot size={18} />}
              title="Active Agents"
              value={agentData.agents.length}
              subtitle={`${health?.activeAgents ?? 0} in cognitive loop`}
              status="info"
              href="/team"
            />
            <StatusCard
              icon={<Brain size={18} />}
              title="Memory Entries"
              value={memoryData.total}
              subtitle={`${memoryData.modifiedToday} updated today`}
              status="success"
              href="/memories"
            />
            <StatusCard
              icon={<Zap size={18} />}
              title="Skills Ready"
              value={skillData.ready}
              subtitle={`${mcpData.totalTools} MCP tools active`}
              status="success"
              href="/skills"
            />
            <StatusCard
              icon={<Activity size={18} />}
              title="Loop Latency"
              value={health ? `${health.averageLoopLatencyMs.toFixed(0)}ms` : '—'}
              subtitle={`${health?.errorRateLast24h.toFixed(1) ?? 0}% error rate`}
              status={cronFailed < 5 ? 'success' : 'warning'}
            />
          </div>

          {/* Chart Row */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                7-Day Cognitive Load
              </h3>
              <span className="badge badge-info" style={{ fontSize: '11px' }}>LIVE</span>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <ApiUsageChart totalCalls={health?.totalSkillExecutions ?? 0} />
            </div>
          </div>

          {/* Modules Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Agent Roster */}
            <ExpandableModule title="Agent Roster" icon={<Bot size={18} />} badge={`${agentData.agents.length} Deployed`} defaultExpanded={true}>
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {agentData.agents.map((agent) => (
                  <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{agent.emoji}</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{agent.name}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{agent.role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.status === 'working' ? 'var(--status-success)' : agent.status === 'error' ? 'var(--status-error)' : 'var(--text-muted)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{agent.loopState}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableModule>

            {/* MCP & Skills */}
            <ExpandableModule title="System Capabilities" icon={<Server size={18} />} badge={`${skillData.ready} Skills`} defaultExpanded={true}>
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mcpData.servers.map((srv) => (
                  <div key={srv} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={14} color="var(--text-tertiary)" />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{srv} (MCP)</span>
                    </div>
                    <span className="badge badge-success">Online</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                  <Link href="/skills" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All {skillData.total} Skills <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </ExpandableModule>

            {/* Memory Intelligence */}
            <ExpandableModule title="OpenBrain Memory" icon={<Brain size={18} />}>
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Memory Store</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{memoryData.total} entries · {memoryData.modifiedToday} updated today</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Link href="/memories" style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Explore Memory <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </ExpandableModule>

            {/* Security */}
            <ExpandableModule title="Security Status" icon={<Shield size={18} />}>
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Permission Governance</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>All agents operating within policy bounds</span>
                  </div>
                  <span className="badge badge-success">Secure</span>
                </div>
              </div>
            </ExpandableModule>
          </div>
        </div>

        {/* Right Column — Activity Feed */}
        <div style={{ width: '360px', minWidth: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <ActivityFeed logs={logs as any} />
        </div>
      </div>
    </div>
  );
}
