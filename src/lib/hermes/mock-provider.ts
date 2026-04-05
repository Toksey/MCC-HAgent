/**
 * hermes/mock-provider.ts — Complete mock data for standalone UI mode.
 *
 * Returns realistic data for all Hermes adapter functions when HERMES_API_URL is not set.
 * This allows the dashboard to be fully functional without a live Hermes backend.
 */

import type {
  HermesAgent,
  AgentCreatePayload,
  AgentUpdatePayload,
  AgentPolicy,
  MemoryEntry,
  MemoryStorePayload,
  MemoryQueryPayload,
  MemoryReflection,
  HermesSkill,
  SkillRegisterPayload,
  SkillExecutePayload,
  SkillExecuteResult,
  SkillScanResult,
  Goal,
  GoalCreatePayload,
  GoalDecomposition,
  TelemetryState,
  CognitiveAction,
  SystemHealth,
  MCPTool,
  MCPToolExecutePayload,
  MCPToolExecuteResult,
  MCPContext,
} from './types';

// ── Utility ────────────────────────────────────────────────────

function uid(): string {
  return `mock_${Math.random().toString(36).slice(2, 10)}`;
}

function ago(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

// ── Mock Agents ────────────────────────────────────────────────

const MOCK_AGENTS: HermesAgent[] = [
  {
    id: 'agent_apex',
    name: 'Apex',
    emoji: '⚡',
    role: 'Lead Engineer — Full-stack architecture, code review, deployment pipelines.',
    model: 'gpt-4o',
    provider: 'openai',
    status: 'working',
    autonomyLevel: 'autonomous',
    loopState: 'acting',
    goals: [],
    skills: ['skill_code', 'skill_review', 'skill_deploy'],
    sessionCount: 147,
    currentTask: 'Refactoring auth middleware',
    createdAt: ago(720),
    updatedAt: ago(0.5),
  },
  {
    id: 'agent_iris',
    name: 'Iris',
    emoji: '🔮',
    role: 'Research Analyst — Data analysis, market research, report generation.',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    status: 'online',
    autonomyLevel: 'balanced',
    loopState: 'thinking',
    goals: [],
    skills: ['skill_research', 'skill_analysis', 'skill_report'],
    sessionCount: 89,
    currentTask: 'Analyzing Q4 market trends',
    createdAt: ago(480),
    updatedAt: ago(1.2),
  },
  {
    id: 'agent_nexus',
    name: 'Nexus',
    emoji: '🕸️',
    role: 'Integration Specialist — API orchestration, data pipeline management.',
    model: 'gemini-2.5-pro',
    provider: 'google',
    status: 'idle',
    autonomyLevel: 'conservative',
    loopState: 'observing',
    goals: [],
    skills: ['skill_api', 'skill_pipeline'],
    sessionCount: 53,
    createdAt: ago(360),
    updatedAt: ago(3),
  },
  {
    id: 'agent_sage',
    name: 'Sage',
    emoji: '🧠',
    role: 'Knowledge Architect — Documentation, knowledge base management, ontology design.',
    model: 'gpt-4o',
    provider: 'openai',
    status: 'working',
    autonomyLevel: 'balanced',
    loopState: 'acting',
    goals: [],
    skills: ['skill_docs', 'skill_knowledge', 'skill_ontology'],
    sessionCount: 112,
    currentTask: 'Building API documentation',
    createdAt: ago(600),
    updatedAt: ago(0.8),
  },
  {
    id: 'agent_atlas',
    name: 'Atlas',
    emoji: '🗺️',
    role: 'DevOps Commander — Infrastructure management, monitoring, incident response.',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    status: 'online',
    autonomyLevel: 'autonomous',
    loopState: 'idle',
    goals: [],
    skills: ['skill_infra', 'skill_monitor', 'skill_deploy'],
    sessionCount: 78,
    createdAt: ago(540),
    updatedAt: ago(2),
  },
];

// ── Mock Memories ──────────────────────────────────────────────

const MOCK_MEMORIES: MemoryEntry[] = [
  {
    id: 'mem_001', agentId: 'agent_apex',
    content: 'The auth middleware uses JWT with RS256. Refresh tokens are stored in httpOnly cookies with a 7-day expiry.',
    type: 'procedural', relevance: 0.95, weight: 3, tags: ['auth', 'security', 'jwt'],
    createdAt: ago(48), updatedAt: ago(2),
  },
  {
    id: 'mem_002', agentId: 'agent_apex',
    content: 'User reported login failures on Safari 17 due to SameSite cookie policy. Fixed by setting SameSite=None with Secure flag.',
    type: 'episodic', relevance: 0.78, weight: 2, tags: ['bug', 'safari', 'cookies'],
    createdAt: ago(96), updatedAt: ago(72),
  },
  {
    id: 'mem_003', agentId: 'agent_iris',
    content: 'Market analysis shows 23% TAM growth in AI-assisted development tools for enterprise. Key competitors: Cursor, Windsurf, Cline.',
    type: 'semantic', relevance: 0.92, weight: 4, tags: ['market', 'ai', 'competition'],
    createdAt: ago(24), updatedAt: ago(12),
  },
  {
    id: 'mem_004', agentId: 'agent_iris',
    content: 'Combining RAG-retrieved context with chain-of-thought prompting increases accuracy by 31% on complex analytical tasks.',
    type: 'reflection', relevance: 0.88, weight: 5, tags: ['rag', 'prompting', 'insight'],
    createdAt: ago(72), updatedAt: ago(24),
  },
  {
    id: 'mem_005', agentId: 'agent_sage',
    content: 'REST API documentation should follow OpenAPI 3.1 spec. All endpoints must include request/response examples, error codes, and rate limit headers.',
    type: 'procedural', relevance: 0.94, weight: 3, tags: ['docs', 'api', 'standards'],
    createdAt: ago(120), updatedAt: ago(48),
  },
  {
    id: 'mem_006', agentId: 'agent_nexus',
    content: 'Webhook retry policy: exponential backoff starting at 1s, max 5 retries, dead-letter queue after exhaustion.',
    type: 'procedural', relevance: 0.91, weight: 2, tags: ['webhooks', 'retry', 'reliability'],
    createdAt: ago(168), updatedAt: ago(72),
  },
  {
    id: 'mem_007', agentId: 'agent_atlas',
    content: 'Production Kubernetes cluster uses 3 node pools: default (n2-standard-4), GPU (a2-highgpu-1g), and preemptible (e2-medium for batch jobs).',
    type: 'semantic', relevance: 0.96, weight: 4, tags: ['infrastructure', 'k8s', 'production'],
    createdAt: ago(240), updatedAt: ago(24),
  },
];

// ── Mock Skills ────────────────────────────────────────────────

const MOCK_SKILLS: HermesSkill[] = [
  { id: 'skill_code', name: 'Code Generation', description: 'Generate, refactor, and optimize source code across multiple languages.', version: '2.3.0', author: 'hermes-core', tags: ['code', 'generation'], permissions: 'read-write', riskLevel: 'medium', status: 'ready', executionCount: 1247, lastExecutedAt: ago(0.5), source: 'local' },
  { id: 'skill_review', name: 'Code Review', description: 'Automated code review with security analysis, performance suggestions, and style enforcement.', version: '1.8.0', author: 'hermes-core', tags: ['review', 'quality'], permissions: 'read-only', riskLevel: 'low', status: 'ready', executionCount: 834, lastExecutedAt: ago(1), source: 'local' },
  { id: 'skill_deploy', name: 'Deployment', description: 'CI/CD pipeline management — build, test, and deploy to staging/production environments.', version: '3.1.0', author: 'hermes-core', tags: ['deploy', 'cicd'], permissions: 'full', riskLevel: 'critical', status: 'ready', executionCount: 156, lastExecutedAt: ago(4), source: 'local' },
  { id: 'skill_research', name: 'Web Research', description: 'Search the web, extract data, and synthesize findings into structured reports.', version: '2.0.1', author: 'hermes-core', tags: ['research', 'web'], permissions: 'read-only', riskLevel: 'low', status: 'ready', executionCount: 567, lastExecutedAt: ago(2), source: 'local' },
  { id: 'skill_analysis', name: 'Data Analysis', description: 'Statistical analysis, trend detection, and visualization of datasets.', version: '1.5.0', author: 'hermes-core', tags: ['data', 'analysis'], permissions: 'read-write', riskLevel: 'medium', status: 'ready', executionCount: 312, lastExecutedAt: ago(6), source: 'local' },
  { id: 'skill_report', name: 'Report Generation', description: 'Generate formatted reports with charts, tables, and executive summaries.', version: '1.2.0', author: 'hermes-core', tags: ['report', 'document'], permissions: 'read-write', riskLevel: 'low', status: 'ready', executionCount: 198, lastExecutedAt: ago(8), source: 'local' },
  { id: 'skill_api', name: 'API Orchestration', description: 'Chain API calls, handle authentication flows, and manage request/response transformations.', version: '2.4.0', author: 'hermes-core', tags: ['api', 'integration'], permissions: 'full', riskLevel: 'high', status: 'ready', executionCount: 423, lastExecutedAt: ago(3), source: 'registry' },
  { id: 'skill_pipeline', name: 'Data Pipeline', description: 'ETL pipeline construction, scheduling, and monitoring.', version: '1.0.0', author: 'community', tags: ['data', 'etl'], permissions: 'read-write', riskLevel: 'medium', status: 'ready', executionCount: 87, lastExecutedAt: ago(12), source: 'registry' },
  { id: 'skill_docs', name: 'Documentation', description: 'Generate and maintain technical documentation from source code and APIs.', version: '2.1.0', author: 'hermes-core', tags: ['docs', 'markdown'], permissions: 'read-write', riskLevel: 'low', status: 'ready', executionCount: 645, lastExecutedAt: ago(1.5), source: 'local' },
  { id: 'skill_knowledge', name: 'Knowledge Graph', description: 'Build and query knowledge graphs from unstructured data.', version: '1.3.0', author: 'hermes-core', tags: ['knowledge', 'graph'], permissions: 'read-write', riskLevel: 'medium', status: 'ready', executionCount: 234, lastExecutedAt: ago(5), source: 'local' },
  { id: 'skill_ontology', name: 'Ontology Design', description: 'Create and maintain domain ontologies for structured knowledge representation.', version: '0.9.0', author: 'community', tags: ['ontology', 'semantic'], permissions: 'read-write', riskLevel: 'low', status: 'ready', executionCount: 45, lastExecutedAt: ago(24), source: 'registry' },
  { id: 'skill_infra', name: 'Infrastructure', description: 'Cloud infrastructure provisioning and management via IaC.', version: '2.0.0', author: 'hermes-core', tags: ['infra', 'cloud'], permissions: 'full', riskLevel: 'critical', status: 'ready', executionCount: 189, lastExecutedAt: ago(6), source: 'local' },
  { id: 'skill_monitor', name: 'Monitoring', description: 'System health monitoring, alerting, and incident triage.', version: '1.7.0', author: 'hermes-core', tags: ['monitoring', 'alerts'], permissions: 'read-only', riskLevel: 'low', status: 'ready', executionCount: 1023, lastExecutedAt: ago(0.2), source: 'local' },
];

// ── Mock Goals ─────────────────────────────────────────────────

const MOCK_GOALS: Goal[] = [
  { id: 'goal_001', agentId: 'agent_apex', title: 'Migrate auth to OAuth 2.1', description: 'Replace custom JWT auth with OAuth 2.1 PKCE flow for improved security.', status: 'active', priority: 'critical', progress: 65, subGoals: [
    { id: 'goal_001a', agentId: 'agent_apex', title: 'Implement PKCE flow', status: 'completed', priority: 'high', progress: 100, subGoals: [], createdAt: ago(48), updatedAt: ago(12), completedAt: ago(12) },
    { id: 'goal_001b', agentId: 'agent_apex', title: 'Add token rotation', status: 'active', priority: 'high', progress: 40, subGoals: [], createdAt: ago(48), updatedAt: ago(2) },
  ], createdAt: ago(72), updatedAt: ago(2) },
  { id: 'goal_002', agentId: 'agent_iris', title: 'Q4 Competitive Intelligence Report', description: 'Comprehensive analysis of competitor product launches and market positioning.', status: 'active', priority: 'high', progress: 78, subGoals: [], createdAt: ago(96), updatedAt: ago(6) },
  { id: 'goal_003', agentId: 'agent_sage', title: 'API v3 Documentation', description: 'Complete OpenAPI 3.1 spec with interactive examples for all endpoints.', status: 'active', priority: 'normal', progress: 45, subGoals: [], createdAt: ago(120), updatedAt: ago(8) },
  { id: 'goal_004', agentId: 'agent_atlas', title: 'Zero-downtime deployment pipeline', description: 'Implement blue-green deployment with automatic rollback.', status: 'pending', priority: 'high', progress: 10, subGoals: [], createdAt: ago(48), updatedAt: ago(24) },
  { id: 'goal_005', agentId: 'agent_nexus', title: 'Webhook reliability audit', description: 'Audit all webhook integrations for reliability, add dead-letter queue.', status: 'completed', priority: 'normal', progress: 100, subGoals: [], createdAt: ago(168), updatedAt: ago(48), completedAt: ago(48) },
];

// ── Mock Cognitive Actions ─────────────────────────────────────

const MOCK_ACTIONS: CognitiveAction[] = [
  { id: 'act_001', agentId: 'agent_apex', type: 'observe', content: 'Detected 3 failing tests in auth module after latest commit.', timestamp: ago(0.3), durationMs: 450 },
  { id: 'act_002', agentId: 'agent_apex', type: 'think', content: 'Root cause analysis: token refresh endpoint returning 401 due to expired signing key rotation. Need to update key cache invalidation.', timestamp: ago(0.25), durationMs: 1200 },
  { id: 'act_003', agentId: 'agent_apex', type: 'act', content: 'Applied fix to key cache invalidation logic. Running test suite.', timestamp: ago(0.2), durationMs: 3400 },
  { id: 'act_004', agentId: 'agent_iris', type: 'observe', content: 'New competitor product announcement detected: Windsurf 2.0 with multi-agent orchestration.', timestamp: ago(1), durationMs: 230 },
  { id: 'act_005', agentId: 'agent_iris', type: 'think', content: 'Evaluating impact on market positioning. Key differentiator: our MCP integration layer provides interoperability advantage. Need to quantify.', timestamp: ago(0.9), durationMs: 1800 },
  { id: 'act_006', agentId: 'agent_sage', type: 'act', content: 'Generated 47 endpoint documentation pages. Validating against live API responses.', timestamp: ago(0.8), durationMs: 8500 },
  { id: 'act_007', agentId: 'agent_nexus', type: 'observe', content: 'Monitoring 12 active webhook subscriptions. All healthy. Average delivery time: 340ms.', timestamp: ago(2), durationMs: 180 },
  { id: 'act_008', agentId: 'agent_atlas', type: 'reflect', content: 'Analysis of last 24h: 2 minor incidents resolved automatically, 0 escalations. System reliability: 99.97%.', timestamp: ago(1.5), durationMs: 600 },
];

// ── Mock MCP Tools ─────────────────────────────────────────────

const MOCK_MCP_TOOLS: MCPTool[] = [
  { id: 'mcp_fs', name: 'filesystem', description: 'Read and write files on the local filesystem.', permissions: 'full', riskLevel: 'high', inputSchema: { type: 'object', properties: { path: { type: 'string' }, operation: { type: 'string', enum: ['read', 'write', 'list'] } } }, source: 'mcp-fs-server', enabled: true },
  { id: 'mcp_web', name: 'web_search', description: 'Search the web and retrieve page contents.', permissions: 'read-only', riskLevel: 'low', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } }, source: 'mcp-web-server', enabled: true },
  { id: 'mcp_db', name: 'database', description: 'Execute SQL queries against connected databases.', permissions: 'read-write', riskLevel: 'critical', inputSchema: { type: 'object', properties: { query: { type: 'string' }, database: { type: 'string' } } }, source: 'mcp-db-server', enabled: true },
  { id: 'mcp_git', name: 'git', description: 'Git operations: commit, push, pull, branch, merge.', permissions: 'full', riskLevel: 'high', inputSchema: { type: 'object', properties: { operation: { type: 'string' }, args: { type: 'array', items: { type: 'string' } } } }, source: 'mcp-git-server', enabled: true },
  { id: 'mcp_browser', name: 'browser', description: 'Browser automation and web scraping.', permissions: 'read-write', riskLevel: 'medium', inputSchema: { type: 'object', properties: { url: { type: 'string' }, action: { type: 'string' } } }, source: 'mcp-browser-server', enabled: false },
];

// ── Mock Provider ──────────────────────────────────────────────

export const mockAgents = {
  async getAgents(): Promise<HermesAgent[]> {
    return [...MOCK_AGENTS.map(a => ({ ...a, goals: MOCK_GOALS.filter(g => g.agentId === a.id) }))];
  },
  async getAgent(id: string): Promise<HermesAgent> {
    const agent = MOCK_AGENTS.find(a => a.id === id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    return { ...agent, goals: MOCK_GOALS.filter(g => g.agentId === id) };
  },
  async createAgent(payload: AgentCreatePayload): Promise<HermesAgent> {
    const agent: HermesAgent = {
      id: uid(), name: payload.name, emoji: payload.emoji || '🤖',
      role: payload.role, model: payload.model, provider: payload.provider,
      status: 'online', autonomyLevel: payload.autonomyLevel || 'balanced',
      loopState: 'idle', goals: [], skills: payload.skills || [],
      sessionCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    return agent;
  },
  async updateAgent(id: string, payload: AgentUpdatePayload): Promise<HermesAgent> {
    const agent = MOCK_AGENTS.find(a => a.id === id);
    if (!agent) throw new Error(`Agent ${id} not found`);
    return { ...agent, ...payload, updatedAt: new Date().toISOString() };
  },
  async deleteAgent(_id: string): Promise<void> {},
  async getAgentPolicy(agentId: string): Promise<AgentPolicy> {
    return {
      agentId, constraints: ['No production deploys without approval', 'Rate limit: 100 API calls/min'],
      autonomyLevel: 'balanced', maxActionsPerHour: 60,
      allowedTools: ['filesystem', 'web_search', 'git'],
      blockedTools: ['database'], requireApproval: false,
      updatedAt: ago(24),
    };
  },
  async updateAgentPolicy(agentId: string, policy: Partial<AgentPolicy>): Promise<AgentPolicy> {
    return { ...await this.getAgentPolicy(agentId), ...policy, updatedAt: new Date().toISOString() };
  },
  async pauseAgent(agentId: string): Promise<HermesAgent> {
    return this.updateAgent(agentId, { loopState: 'paused', status: 'paused' });
  },
  async resumeAgent(agentId: string): Promise<HermesAgent> {
    return this.updateAgent(agentId, { loopState: 'idle', status: 'online' });
  },
  async stepAgent(agentId: string): Promise<HermesAgent> {
    return this.updateAgent(agentId, { loopState: 'acting' });
  },
};

export const mockMemory = {
  async getMemories(agentId: string): Promise<MemoryEntry[]> {
    return MOCK_MEMORIES.filter(m => m.agentId === agentId);
  },
  async storeMemory(agentId: string, payload: MemoryStorePayload): Promise<MemoryEntry> {
    return { id: uid(), agentId, content: payload.content, type: payload.type || 'episodic', relevance: 0.5, weight: 1, tags: payload.tags || [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },
  async queryMemory(agentId: string, payload: MemoryQueryPayload): Promise<MemoryEntry[]> {
    const memories = MOCK_MEMORIES.filter(m => m.agentId === agentId);
    return memories.filter(m => m.content.toLowerCase().includes(payload.query.toLowerCase())).slice(0, payload.limit || 10);
  },
  async getMemory(memoryId: string): Promise<MemoryEntry> {
    const mem = MOCK_MEMORIES.find(m => m.id === memoryId);
    if (!mem) throw new Error(`Memory ${memoryId} not found`);
    return { ...mem };
  },
  async updateMemory(memoryId: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry> {
    const mem = MOCK_MEMORIES.find(m => m.id === memoryId);
    if (!mem) throw new Error(`Memory ${memoryId} not found`);
    return { ...mem, ...updates, updatedAt: new Date().toISOString() };
  },
  async deleteMemory(_memoryId: string): Promise<void> {},
  async reinforceMemory(memoryId: string): Promise<MemoryEntry> {
    const mem = MOCK_MEMORIES.find(m => m.id === memoryId);
    if (!mem) throw new Error(`Memory ${memoryId} not found`);
    return { ...mem, weight: mem.weight + 1, updatedAt: new Date().toISOString() };
  },
  async reflectMemory(agentId: string): Promise<MemoryReflection> {
    const count = MOCK_MEMORIES.filter(m => m.agentId === agentId).length;
    return {
      agentId, synthesis: 'Cross-referencing recent procedural memories with episodic data reveals consistent patterns in error handling approaches. Key insight: proactive monitoring reduces incident response time by 40%.',
      insights: ['Error patterns cluster around auth subsystem between 02:00-04:00 UTC', 'Documentation quality correlates with reduced support tickets', 'Webhook retry patterns could be optimized with adaptive backoff'],
      memoryCount: count, reflectedAt: new Date().toISOString(),
    };
  },
  async getAllMemories(): Promise<MemoryEntry[]> {
    return [...MOCK_MEMORIES];
  },
};

export const mockSkills = {
  async listSkills(): Promise<HermesSkill[]> { return [...MOCK_SKILLS]; },
  async getSkill(id: string): Promise<HermesSkill> {
    const skill = MOCK_SKILLS.find(s => s.id === id);
    if (!skill) throw new Error(`Skill ${id} not found`);
    return { ...skill };
  },
  async registerSkill(payload: SkillRegisterPayload): Promise<HermesSkill> {
    return { id: uid(), ...payload, version: payload.version || '0.1.0', author: payload.author || 'user', tags: payload.tags || [], permissions: payload.permissions || 'read-only', riskLevel: payload.riskLevel || 'low', status: 'ready', executionCount: 0, source: 'local' };
  },
  async executeSkill(_skillId: string, _payload: SkillExecutePayload): Promise<SkillExecuteResult> {
    return { success: true, output: { message: 'Skill executed successfully in mock mode.', data: { processed: 42 } }, durationMs: 1234, executedAt: new Date().toISOString() };
  },
  async toggleSkill(_agentId: string, _skillId: string, _enabled: boolean): Promise<void> {},
  async scanSkill(skillId: string): Promise<SkillScanResult> {
    return { skillId, riskLevel: 'low', warnings: [], dataAccess: ['filesystem:read'], externalCalls: [], writePermissions: [], scannedAt: new Date().toISOString() };
  },
};

export const mockGoals = {
  async getGoals(agentId: string): Promise<Goal[]> {
    return MOCK_GOALS.filter(g => g.agentId === agentId);
  },
  async getGoal(goalId: string): Promise<Goal> {
    const goal = MOCK_GOALS.find(g => g.id === goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    return { ...goal };
  },
  async createGoal(agentId: string, payload: GoalCreatePayload): Promise<Goal> {
    return { id: uid(), agentId, title: payload.title, description: payload.description, status: 'pending', priority: payload.priority || 'normal', progress: 0, subGoals: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },
  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const goal = MOCK_GOALS.find(g => g.id === goalId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    return { ...goal, ...updates, updatedAt: new Date().toISOString() };
  },
  async deleteGoal(_goalId: string): Promise<void> {},
  async decomposeGoal(goalId: string): Promise<GoalDecomposition> {
    return {
      goalId,
      subGoals: [
        { title: 'Research best practices', priority: 'high' },
        { title: 'Create implementation spec', priority: 'normal' },
        { title: 'Build prototype', priority: 'normal' },
        { title: 'Write tests', priority: 'high' },
      ],
      reasoning: 'Decomposed based on standard engineering workflow: research → design → implement → verify.',
      decomposedAt: new Date().toISOString(),
    };
  },
  async getAllGoals(): Promise<Goal[]> { return [...MOCK_GOALS]; },
};

export const mockTelemetry = {
  async getAgentState(agentId: string): Promise<TelemetryState> {
    const agent = MOCK_AGENTS.find(a => a.id === agentId);
    return {
      agentId, loopPhase: agent?.loopState || 'idle', loopFrequencyMs: 15000,
      lastAction: MOCK_ACTIONS.find(a => a.agentId === agentId),
      latencyMs: 340 + Math.random() * 200, errorRate: Math.random() * 5,
      uptimeSeconds: 86400 + Math.floor(Math.random() * 172800),
      memoryCount: MOCK_MEMORIES.filter(m => m.agentId === agentId).length,
      activeGoals: MOCK_GOALS.filter(g => g.agentId === agentId && g.status === 'active').length,
      skillUsage: { skill_code: 234, skill_review: 123, skill_deploy: 45 },
    };
  },
  async getAgentLogs(agentId: string, limit = 50): Promise<CognitiveAction[]> {
    return MOCK_ACTIONS.filter(a => a.agentId === agentId).slice(0, limit);
  },
  async getAgentActions(agentId: string, limit = 20): Promise<CognitiveAction[]> {
    return MOCK_ACTIONS.filter(a => a.agentId === agentId && a.type === 'act').slice(0, limit);
  },
  async getAgentThoughts(agentId: string, limit = 20): Promise<CognitiveAction[]> {
    return MOCK_ACTIONS.filter(a => a.agentId === agentId && a.type === 'think').slice(0, limit);
  },
  async getLoopStatus(agentId: string) {
    const agent = MOCK_AGENTS.find(a => a.id === agentId);
    return {
      phase: agent?.loopState || 'idle' as const,
      latencyMs: 340, lastAction: MOCK_ACTIONS.find(a => a.agentId === agentId),
      nextPredicted: 'Evaluate test results and determine next action',
    };
  },
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      activeAgents: MOCK_AGENTS.filter(a => a.status !== 'offline').length,
      totalGoals: MOCK_GOALS.length, completedGoals: MOCK_GOALS.filter(g => g.status === 'completed').length,
      totalMemories: MOCK_MEMORIES.length, memoryGrowthRate: 2.3,
      totalSkillExecutions: MOCK_SKILLS.reduce((sum, s) => sum + s.executionCount, 0),
      averageLoopLatencyMs: 340, errorRateLast24h: 1.2, uptimeSeconds: 259200,
    };
  },
};

export const mockMCP = {
  async listTools(): Promise<MCPTool[]> { return [...MOCK_MCP_TOOLS]; },
  async getTool(toolId: string): Promise<MCPTool> {
    const tool = MOCK_MCP_TOOLS.find(t => t.id === toolId);
    if (!tool) throw new Error(`Tool ${toolId} not found`);
    return { ...tool };
  },
  async registerTool(tool: Omit<MCPTool, 'id'>): Promise<MCPTool> {
    return { id: uid(), ...tool };
  },
  async executeTool(_toolId: string, _payload: MCPToolExecutePayload): Promise<MCPToolExecuteResult> {
    return { success: true, output: { message: 'Tool executed in mock mode.' }, durationMs: 567, executedAt: new Date().toISOString() };
  },
  async injectContext(agentId: string, context: Record<string, unknown>): Promise<MCPContext> {
    return { agentId, context, injectedAt: new Date().toISOString() };
  },
  async getToolPermissions(agentId: string): Promise<{ toolId: string; enabled: boolean }[]> {
    return MOCK_MCP_TOOLS.map(t => ({ toolId: t.id, enabled: t.enabled }));
    void agentId;
  },
  async setToolPermission(_agentId: string, _toolId: string, _enabled: boolean): Promise<void> {},
};
