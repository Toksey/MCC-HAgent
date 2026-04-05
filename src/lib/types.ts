// ── Agent ───────────────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  workspace?: string;
  agentDir?: string;
  sessionCount: number;
  status: 'online' | 'idle' | 'working' | 'error' | 'offline';
  currentTask?: string;
  soulPreview?: string;
  // V2 fields
  companyId?: string;
  managerAgentId?: string;
  maxConcurrency?: number;
  provider?: string;
  modelTier?: string;
  heartbeatStatus?: 'healthy' | 'degraded' | 'unresponsive' | 'unknown';
  archived?: boolean;
  budgetMonthSpend?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'normal' | 'low';
  agentId?: string;
  model?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
  // V2 fields
  companyId?: string;
  routineRunId?: string;
}

// ── Cron ────────────────────────────────────────────────────────
export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  agentId?: string;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
    at?: string;
  };
  payload: {
    kind: string;
    text?: string;
    message?: string;
  };
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastDurationMs?: number;
    lastError?: string;
    consecutiveErrors?: number;
    nextRunAtMs?: number;
    lastDeliveryStatus?: string;
  };
  humanSchedule?: string;
}

// ── Session ────────────────────────────────────────────────────
export interface Session {
  id: string;
  agentId: string;
  channelKey?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

// ── Memory ─────────────────────────────────────────────────────
export interface MemoryFile {
  filename: string;
  path: string;
  date?: string;
  category?: string;
  sizeBytes: number;
  modifiedAt: string;
}

// ── Skill ──────────────────────────────────────────────────────
export interface Skill {
  name: string;
  emoji?: string;
  description: string;
  dirName: string;
  source: 'workspace' | 'bundled' | 'clawhub';
  status: 'ready' | 'missing-requirements' | 'blocked';
  lastModified?: string;
}

// ── Channel ────────────────────────────────────────────────────
export interface Channel {
  id: string;
  name: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'configured' | 'not-configured';
  config: Record<string, unknown>;
}

// ── Delivery Message ───────────────────────────────────────────
export interface DeliveryMessage {
  id: string;
  recipient?: string;
  channel?: string;
  status: 'pending' | 'delivered' | 'failed';
  retryCount?: number;
  lastError?: string;
  createdAt?: string;
}

// ── Gateway Status ─────────────────────────────────────────────
export interface GatewayStatus {
  running: boolean;
  port: number;
  mode: string;
  uptime?: number;
  errorCount: number;
  recentLogs: LogEntry[];
}

// ── Log Entry ──────────────────────────────────────────────────
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
  raw: string;
}

// ── OpenClaw Config (top-level shape) ──────────────────────────
export interface OpenClawConfig {
  agents: {
    defaults: {
      model: {
        primary: string;
        fallbacks: string[];
      };
      heartbeat: {
        every: string;
      };
      workspace: string;
    };
    list: Array<{
      id: string;
      name?: string;
      workspace?: string;
      agentDir?: string;
      model?: string;
      identity?: {
        name?: string;
        emoji?: string;
        role?: string;
      };
    }>;
  };
  models: {
    providers: Record<string, {
      baseUrl: string;
      models: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
  channels: Record<string, {
    enabled: boolean;
    [key: string]: unknown;
  }>;
  plugins: {
    entries: Record<string, {
      enabled: boolean;
    }>;
  };
  gateway: {
    port: number;
    mode: string;
    auth: {
      mode: string;
      token: string;
    };
  };
}

// ── Foundry ────────────────────────────────────────────────────
export interface FoundryPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  successRate: number;
  exampleGoal: string;
  toolsUsed: string[];
  averageDuration: number;
  crystallizeReady: boolean;
  proposedCode?: string;
}

export interface CrystallizedTool {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'retired' | 'failing';
  successRate: number;
  timeSavedMs: number;
}

// ── V2: Company ────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  mission?: string;
  goals?: string[];
  defaultAgentId?: string;
  defaultMode: OperatingMode;
  createdAt: string;
  updatedAt: string;
}

export type OperatingMode = 'conservative' | 'maximizer';

// ── V2: Inbox ──────────────────────────────────────────────────
export interface InboxItem {
  id: string;
  companyId: string;
  kind: 'hire-request' | 'approval' | 'alert' | 'feedback' | 'system';
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  origin: 'human' | 'agent' | 'system';
  originAgentId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
}

// ── V2: Budget ─────────────────────────────────────────────────
export interface BudgetState {
  companyId: string;
  monthKey: string; // YYYY-MM
  hardCapUsd: number;
  softCapUsd: number;
  currentSpendUsd: number;
  autoApproveThresholdUsd: number;
  alertTriggered: boolean;
  agentSpend: Record<string, number>; // agentId → spend
}

// ── V2: Scheduled Job (unified) ────────────────────────────────
export interface ScheduledJob {
  id: string;
  kind: 'cron' | 'routine' | 'playbook';
  companyId?: string;
  name: string;
  enabled: boolean;
  agentId?: string;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
    at?: string;
  };
  payload: {
    kind: string;
    text?: string;
    message?: string;
  };
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastDurationMs?: number;
    lastError?: string;
    consecutiveErrors?: number;
    nextRunAtMs?: number;
    lastDeliveryStatus?: string;
  };
  sourceRef?: string; // link back to routine/playbook ID
  humanSchedule?: string;
}

// ── V2: Routine ────────────────────────────────────────────────
export interface Routine {
  id: string;
  companyId: string;
  name: string;
  templatePrompt: string;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
    at?: string;
  };
  agentId?: string;
  labels?: string[];
  expectedOutputs?: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineRun {
  id: string;
  routineId: string;
  companyId: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  spendUsd?: number;
  outputSummary?: string;
  artifacts?: string[];
}

// ── V2: Heartbeat ──────────────────────────────────────────────
export interface HeartbeatConfig {
  agentId: string;
  intervalMs: number;
  template: 'default' | 'minimal' | 'verbose' | 'custom';
  customPrompt?: string;
  lastPingAt?: string;
  lastPingStatus?: 'ok' | 'timeout' | 'error';
}

// ── V2: Feedback / Eval ────────────────────────────────────────
export interface FeedbackEntry {
  id: string;
  companyId: string;
  targetKind: 'task' | 'routine-run' | 'chat-session';
  targetId: string;
  agentId?: string;
  rating: 'up' | 'down';
  note?: string;
  tags?: string[];
  repeated?: boolean;
  createdAt: string;
}

// ── V2: Workflow Template ──────────────────────────────────────
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  company?: Partial<Company>;
  agents?: Array<Partial<Agent>>;
  routines?: Array<Partial<Routine>>;
  skills?: string[];
  budgetDefaults?: Partial<BudgetState>;
  createdAt: string;
}

// ── V2: Agent Archive ──────────────────────────────────────────
export interface AgentArchive {
  agentId: string;
  companyId: string;
  reason: string;
  archivedAt: string;
  totalSessions: number;
  totalSpendUsd: number;
  performanceSummary?: string;
}

// ── V2: Mission Control State ──────────────────────────────────
export interface McState {
  activeCompanyId: string | null;
  mode: OperatingMode;
  version: number;
}
