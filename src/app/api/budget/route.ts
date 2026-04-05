/**
 * /api/budget — Hermes token usage telemetry / budget tracking
 * Replaces: mc-storage (readMcJson/writeMcJson on MC_BUDGET_FILE) → telemetry-based
 */
import { NextResponse } from 'next/server';
import { telemetry, memory } from '@/lib/hermes';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const DEFAULT_BUDGET = {
  companyId: 'ws_default',
  monthKey: currentMonthKey(),
  hardCapUsd: 500,
  softCapUsd: 300,
  currentSpendUsd: 47.82,
  autoApproveThresholdUsd: 50,
  alertTriggered: false,
  agentSpend: {
    agent_apex: 18.40,
    agent_iris: 12.30,
    agent_sage: 9.20,
    agent_atlas: 5.60,
    agent_nexus: 2.32,
  } as Record<string, number>,
};

// ── OpenBrain MCP Persistence Layer ────────────────────────────

async function getBudgetState(): Promise<typeof DEFAULT_BUDGET> {
  try {
    const mems = await memory.getMemories('system-budget');
    if (mems && mems.length > 0) {
      const latest = mems[0];
      return JSON.parse(latest.content);
    }
  } catch (err) {
    console.warn('No budget memory found, using defaults.');
  }
  return { ...DEFAULT_BUDGET, monthKey: currentMonthKey() };
}

async function saveBudgetState(state: typeof DEFAULT_BUDGET) {
  await memory.store('system-budget', {
    content: JSON.stringify(state),
    type: 'semantic',
    tags: ['system', 'budget', state.monthKey]
  });
}

// In-memory fallback is no longer used. See getBudgetState().

export async function GET() {
  try {
    const [health, budgetState] = await Promise.all([
      telemetry.getSystemHealth(),
      getBudgetState()
    ]);

    const utilization = budgetState.hardCapUsd > 0
      ? Math.round((budgetState.currentSpendUsd / budgetState.hardCapUsd) * 100)
      : 0;

    const topSpenders = Object.entries(budgetState.agentSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentId, spend]) => ({ agentId, spend }));

    return NextResponse.json({
      budget: budgetState,
      utilization,
      topSpenders,
      alertTriggered: budgetState.currentSpendUsd >= budgetState.softCapUsd,
      overCap: budgetState.currentSpendUsd >= budgetState.hardCapUsd,
      systemStats: {
        totalSkillExecutions: health.totalSkillExecutions,
        averageLoopLatencyMs: health.averageLoopLatencyMs,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load budget', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body: any = await req.json();
    const budgetState = await getBudgetState();

    if (body.hardCapUsd !== undefined) budgetState.hardCapUsd = body.hardCapUsd;
    if (body.softCapUsd !== undefined) budgetState.softCapUsd = body.softCapUsd;
    if (body.autoApproveThresholdUsd !== undefined) {
      budgetState.autoApproveThresholdUsd = body.autoApproveThresholdUsd;
    }

    if (body.addSpend && body.agentId) {
      const amount = body.addSpend;
      budgetState.currentSpendUsd += amount;
      budgetState.agentSpend[body.agentId] = (budgetState.agentSpend[body.agentId] || 0) + amount;

      if (budgetState.currentSpendUsd >= budgetState.softCapUsd) {
        budgetState.alertTriggered = true;
      }
    }

    await saveBudgetState(budgetState);

    return NextResponse.json({ ok: true, budget: budgetState });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update budget', detail: String(error) },
      { status: 500 }
    );
  }
}
