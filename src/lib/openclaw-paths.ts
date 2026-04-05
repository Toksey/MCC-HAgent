import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();

// ── Root resolution ────────────────────────────────────────────
// Resolved from environment (set during onboarding) or default ~/.openclaw
export const OPENCLAW_HOME = process.env.OPENCLAW_HOME || join(HOME, '.openclaw');

// ── Main config ────────────────────────────────────────────────
export const OPENCLAW_CONFIG = join(OPENCLAW_HOME, 'openclaw.json');

// ── Agents ─────────────────────────────────────────────────────
export const AGENTS_DIR = join(OPENCLAW_HOME, 'agents');
export const agentSessionsDir = (agentId: string) =>
  join(AGENTS_DIR, agentId, 'sessions');
export const agentSessionsFile = (agentId: string) =>
  join(agentSessionsDir(agentId), 'sessions.json');

// ── Agent workspace resolver ───────────────────────────────────
// The workspace directory name varies across installs (clawd, clawdbot,
// openclaw, moltbot, etc.). We resolve it dynamically from openclaw.json
// rather than hardcoding any path.
let _cachedWorkspaceRoot: string | null = null;

export async function getWorkspaceRoot(): Promise<string> {
  if (_cachedWorkspaceRoot) return _cachedWorkspaceRoot;
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw);
    const workspace = config?.agents?.defaults?.workspace;
    if (workspace) {
      // Resolve ~ in path
      const resolved = workspace.startsWith('~') ? join(HOME, workspace.slice(1)) : workspace;
      _cachedWorkspaceRoot = resolved;
      return resolved;
    }
  } catch { /* fall through */ }
  // Fallback: check common directory names
  const candidates = ['clawd', 'clawdbot', 'openclaw', 'moltbot'];
  const fs = await import('fs/promises');
  for (const name of candidates) {
    const candidate = join(HOME, name);
    try {
      await fs.access(candidate);
      _cachedWorkspaceRoot = candidate;
      return candidate;
    } catch { /* next */ }
  }
  // Ultimate fallback
  _cachedWorkspaceRoot = join(HOME, '.openclaw', 'workspace');
  return _cachedWorkspaceRoot;
}

// ── Per-agent workspace resolver ───────────────────────────────
export async function getAgentWorkspace(agentId: string): Promise<string> {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(OPENCLAW_CONFIG, 'utf-8');
    const config = JSON.parse(raw);
    const agent = (config?.agents?.list || []).find((a: any) => a.id === agentId);
    if (agent?.workspace) {
      return agent.workspace.startsWith('~') ? join(HOME, agent.workspace.slice(1)) : agent.workspace;
    }
  } catch { /* fall through */ }
  return join(AGENTS_DIR, agentId, 'workspace');
}

// ── Identity files (resolved dynamically) ──────────────────────
export async function getIdentityFile(filename: string): Promise<string> {
  const root = await getWorkspaceRoot();
  return join(root, filename);
}

// ── Memory files (resolved dynamically) ────────────────────────
export async function getMemoryDir(): Promise<string> {
  const root = await getWorkspaceRoot();
  return join(root, 'memory');
}

// ── Sub-agents ─────────────────────────────────────────────────
export const SUBAGENTS_DIR = join(OPENCLAW_HOME, 'subagents');
export const SUBAGENTS_RUNS = join(SUBAGENTS_DIR, 'runs.json');

// ── Cron ───────────────────────────────────────────────────────
export const CRON_JOBS = join(OPENCLAW_HOME, 'cron', 'jobs.json');
export const CRON_RUNS_DIR = join(OPENCLAW_HOME, 'cron', 'runs');

// ── Foundry ────────────────────────────────────────────────────
export const FOUNDRY_DIR = join(OPENCLAW_HOME, 'foundry');
export const FOUNDRY_PATTERNS = join(FOUNDRY_DIR, 'patterns.json');

// ── Skills ─────────────────────────────────────────────────────
export const WORKSPACE_SKILLS_DIR = join(OPENCLAW_HOME, 'workspace', 'skills');

// ── Logs ───────────────────────────────────────────────────────
export const GATEWAY_LOG = join(OPENCLAW_HOME, 'logs', 'gateway.log');
export const GATEWAY_ERR_LOG = join(OPENCLAW_HOME, 'logs', 'gateway.err.log');
export const COMMANDS_LOG = join(OPENCLAW_HOME, 'logs', 'commands.log');
export const CONFIG_AUDIT_LOG = join(OPENCLAW_HOME, 'logs', 'config-audit.jsonl');

// ── Delivery ───────────────────────────────────────────────────
export const DELIVERY_QUEUE_DIR = join(OPENCLAW_HOME, 'delivery-queue');

// ── Ares Command own data ───────────────────────────────────
export const MC_DATA_DIR = join(OPENCLAW_HOME, 'mission-control');
export const MC_TASKS_FILE = join(MC_DATA_DIR, 'tasks.json');
export const MC_PROJECTS_FILE = join(MC_DATA_DIR, 'projects.json');
export const MC_CONFIG_FILE = join(MC_DATA_DIR, 'config.json');

// ── V2: Company-aware state ─────────────────────────────────
export const MC_COMPANIES_FILE = join(MC_DATA_DIR, 'companies.json');
export const MC_INBOX_FILE = join(MC_DATA_DIR, 'inbox.json');
export const MC_BUDGET_FILE = join(MC_DATA_DIR, 'budget.json');
export const MC_ROUTINES_FILE = join(MC_DATA_DIR, 'routines.json');
export const MC_ROUTINE_RUNS_FILE = join(MC_DATA_DIR, 'routine-runs.json');
export const MC_FEEDBACK_FILE = join(MC_DATA_DIR, 'feedback.json');
export const MC_WORKFLOWS_FILE = join(MC_DATA_DIR, 'workflows.json');
export const MC_STATE_FILE = join(MC_DATA_DIR, 'state.json');

// ── V2: Per-agent extended files ────────────────────────────
export const agentHeartbeatFile = (agentId: string) =>
  join(AGENTS_DIR, agentId, 'heartbeat.json');
export const agentArchiveFile = (agentId: string) =>
  join(AGENTS_DIR, agentId, 'archive.json');
