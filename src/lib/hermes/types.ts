// ── Hermes Agent Types ─────────────────────────────────────────
// Strongly-typed interfaces for the Hermes cognitive agent system.

// ── Core Agent ─────────────────────────────────────────────────

export type LoopPhase = 'idle' | 'observing' | 'thinking' | 'acting' | 'paused' | 'error';
export type AutonomyLevel = 'conservative' | 'balanced' | 'autonomous';
export type AgentStatus = 'online' | 'idle' | 'working' | 'paused' | 'error' | 'offline';
export type ChatRole = 'user' | 'assistant' | 'system';

export interface HermesAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  provider?: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  loopState: LoopPhase;
  goals: Goal[];
  skills: string[]; // skill IDs enabled for this agent
  sessionCount: number;
  currentTask?: string;
  lastAction?: CognitiveAction;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCreatePayload {
  name: string;
  emoji?: string;
  role: string;
  model: string;
  provider?: string;
  autonomyLevel?: AutonomyLevel;
  skills?: string[];
}

export interface AgentUpdatePayload {
  name?: string;
  emoji?: string;
  role?: string;
  model?: string;
  provider?: string;
  status?: AgentStatus;
  autonomyLevel?: AutonomyLevel;
  loopState?: LoopPhase;
  skills?: string[];
}

export interface AgentDocumentGenerationResult {
  content: string;
}

// ── Memory (OpenBrain) ─────────────────────────────────────────

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'reflection';

export interface MemoryEntry {
  id: string;
  agentId: string;
  content: string;
  type: MemoryType;
  relevance: number; // 0.0 – 1.0
  weight: number;    // reinforcement weight
  tags: string[];
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryStorePayload {
  content: string;
  type?: MemoryType;
  tags?: string[];
}

export interface MemoryQueryPayload {
  query: string;
  limit?: number;
  type?: MemoryType;
  minRelevance?: number;
}

export interface MemoryReflection {
  agentId: string;
  synthesis: string;
  insights: string[];
  memoryCount: number;
  reflectedAt: string;
}

// ── Skills ─────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PermissionLevel = 'read-only' | 'read-write' | 'full';
export type SkillStatus = 'ready' | 'disabled' | 'error' | 'scanning';

export interface HermesSkill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  permissions: PermissionLevel;
  riskLevel: RiskLevel;
  status: SkillStatus;
  executionCount: number;
  lastExecutedAt?: string;
  source: 'local' | 'registry' | 'mcp';
}

export interface SkillExecutePayload {
  inputs: Record<string, unknown>;
}

export interface SkillExecuteResult {
  success: boolean;
  output: unknown;
  durationMs: number;
  executedAt: string;
}

export interface SkillRegisterPayload {
  name: string;
  description: string;
  version?: string;
  author?: string;
  tags?: string[];
  permissions?: PermissionLevel;
  riskLevel?: RiskLevel;
}

export interface SkillScanResult {
  skillId: string;
  riskLevel: RiskLevel;
  warnings: string[];
  dataAccess: string[];
  externalCalls: string[];
  writePermissions: string[];
  scannedAt: string;
}

// ── Goals ──────────────────────────────────────────────────────

export type GoalStatus = 'pending' | 'active' | 'completed' | 'failed' | 'decomposed';

export interface Goal {
  id: string;
  agentId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: 'critical' | 'high' | 'normal' | 'low';
  subGoals: Goal[];
  parentGoalId?: string;
  progress: number; // 0–100
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GoalCreatePayload {
  title: string;
  description?: string;
  priority?: Goal['priority'];
}

export interface GoalDecomposition {
  goalId: string;
  subGoals: GoalCreatePayload[];
  reasoning: string;
  decomposedAt: string;
}

// ── Telemetry ──────────────────────────────────────────────────

export interface TelemetryState {
  agentId: string;
  loopPhase: LoopPhase;
  loopFrequencyMs: number;
  lastAction?: CognitiveAction;
  nextPredicted?: string;
  latencyMs: number;
  errorRate: number;   // percentage 0–100
  uptimeSeconds: number;
  memoryCount: number;
  activeGoals: number;
  skillUsage: Record<string, number>; // skillId → execution count
}

export type CognitiveActionType = 'observe' | 'think' | 'act' | 'reflect' | 'error';

export interface CognitiveAction {
  id: string;
  agentId: string;
  type: CognitiveActionType;
  content: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  timestamp: string;
}

export interface SystemHealth {
  activeAgents: number;
  totalGoals: number;
  completedGoals: number;
  totalMemories: number;
  memoryGrowthRate: number; // entries per hour
  totalSkillExecutions: number;
  averageLoopLatencyMs: number;
  errorRateLast24h: number;
  uptimeSeconds: number;
}

// ── Agent Policies ─────────────────────────────────────────────

export interface AgentPolicy {
  agentId: string;
  constraints: string[];
  autonomyLevel: AutonomyLevel;
  maxActionsPerHour: number;
  allowedTools: string[];
  blockedTools: string[];
  requireApproval: boolean;
  updatedAt: string;
}

// ── MCP (Model Context Protocol) ──────────────────────────────

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  permissions: PermissionLevel;
  riskLevel: RiskLevel;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  source: string; // MCP server name
  enabled: boolean;
}

export interface MCPToolExecutePayload {
  inputs: Record<string, unknown>;
  agentId?: string;
}

export interface MCPToolExecuteResult {
  success: boolean;
  output: unknown;
  durationMs: number;
  executedAt: string;
}

export interface MCPContext {
  agentId: string;
  context: Record<string, unknown>;
  injectedAt: string;
}

// ── API Error ──────────────────────────────────────────────────

export interface HermesApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}
