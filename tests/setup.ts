/**
 * tests/setup.ts — Global test setup for MCC-HAgent API route tests.
 *
 * Mocks:
 *  - @/lib/hermes  → mockAgents, mockMemory, mockSkills, mockGoals, mockTelemetry, mockMCP
 *  - next/server   → lightweight NextResponse stub
 */

import { vi } from 'vitest';

// ── Mock Hermes library ─────────────────────────────────────────────────────

const MOCK_AGENTS = [
  { id: 'agent_apex', name: 'Apex', emoji: '⚡', role: 'Lead Engineer', model: 'gpt-4o', provider: 'openai', status: 'working', autonomyLevel: 'autonomous', loopState: 'acting', goals: [], skills: ['skill_code'], sessionCount: 147, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' },
  { id: 'agent_iris', name: 'Iris', emoji: '🔮', role: 'Research Analyst', model: 'claude-sonnet-4-20250514', provider: 'anthropic', status: 'online', autonomyLevel: 'balanced', loopState: 'thinking', goals: [], skills: ['skill_research'], sessionCount: 89, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' },
];

const MOCK_MEMORIES = [
  { id: 'mem_001', agentId: 'agent_apex', content: 'Auth uses JWT RS256', type: 'procedural', relevance: 0.95, weight: 3, tags: ['auth'], createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' },
  { id: 'mem_002', agentId: 'agent_iris', content: 'Market TAM is 23% growth', type: 'semantic', relevance: 0.88, weight: 2, tags: ['market'], createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' },
];

vi.mock('@/lib/hermes', () => ({
  agents: {
    getAgents: vi.fn(async () => [...MOCK_AGENTS]),
    getAgent: vi.fn(async (id: string) => {
      const a = MOCK_AGENTS.find(a => a.id === id);
      if (!a) throw new Error(`Agent ${id} not found`);
      return { ...a };
    }),
    createAgent: vi.fn(async (payload: Record<string, unknown>) => ({
      id: 'agent_new', ...payload, status: 'online', loopState: 'idle',
      goals: [], sessionCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })),
    updateAgent: vi.fn(async (id: string, payload: Record<string, unknown>) => {
      const a = MOCK_AGENTS.find(a => a.id === id);
      if (!a) throw new Error(`Agent ${id} not found`);
      return { ...a, ...payload, updatedAt: new Date().toISOString() };
    }),
    deleteAgent: vi.fn(async () => {}),
    getAgentPolicy: vi.fn(async (agentId: string) => ({ agentId, autonomyLevel: 'balanced', maxActionsPerHour: 60, allowedTools: [], blockedTools: [], requireApproval: false, updatedAt: new Date().toISOString() })),
  },
  memory: {
    getAll: vi.fn(async () => [...MOCK_MEMORIES]),
    getMemories: vi.fn(async (agentId: string) => MOCK_MEMORIES.filter(m => m.agentId === agentId)),
    query: vi.fn(async (agentId: string, { query }: { query: string }) =>
      MOCK_MEMORIES.filter(m => m.agentId === agentId && m.content.toLowerCase().includes(query.toLowerCase()))
    ),
    store: vi.fn(async (_agentId: string, payload: Record<string, unknown>) => ({
      id: 'mem_new', agentId: _agentId, ...payload, relevance: 0.5, weight: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })),
    update: vi.fn(async (memoryId: string, updates: Record<string, unknown>) => {
      const m = MOCK_MEMORIES.find(m => m.id === memoryId);
      if (!m) throw new Error(`Memory ${memoryId} not found`);
      return { ...m, ...updates, updatedAt: new Date().toISOString() };
    }),
    delete: vi.fn(async () => {}),
    reflect: vi.fn(async (agentId: string) => ({
      agentId, synthesis: 'Reflection synthesis', insights: ['Insight 1', 'Insight 2'],
      memoryCount: 2, reflectedAt: new Date().toISOString(),
    })),
  },
  skills: {
    listSkills: vi.fn(async () => [
      { id: 'skill_code', name: 'Code Generation', status: 'ready', executionCount: 1000 },
    ]),
  },
  goals: {
    getAllGoals: vi.fn(async () => []),
    getGoals: vi.fn(async () => []),
  },
  telemetry: {
    getSystemHealth: vi.fn(async () => ({
      activeAgents: 4, totalGoals: 5, completedGoals: 1, totalMemories: 7,
      memoryGrowthRate: 2.3, totalSkillExecutions: 4500, averageLoopLatencyMs: 340,
      errorRateLast24h: 1.2, uptimeSeconds: 259200,
    })),
    getAgentState: vi.fn(async (agentId: string) => ({
      agentId, loopPhase: 'acting', loopFrequencyMs: 15000, latencyMs: 340,
      errorRate: 1.2, uptimeSeconds: 86400, memoryCount: 2, activeGoals: 1,
      skillUsage: { skill_code: 234 },
    })),
  },
  mcp: {
    listTools: vi.fn(async () => []),
  },
}));

// ── Minimal NextResponse/NextRequest stub ───────────────────────────────────

class MockNextResponse {
  status: number;
  _body: unknown;
  headers: Headers;

  constructor(body: unknown, init?: ResponseInit) {
    this.status = init?.status ?? 200;
    this._body = body;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }

  static json(data: unknown, init?: ResponseInit) {
    return new MockNextResponse(data, init);
  }
}

vi.stubGlobal('NextResponse', MockNextResponse);

// Also mock next/server module
vi.mock('next/server', () => ({
  NextResponse: MockNextResponse,
  NextRequest: class MockNextRequest extends Request {},
}));
