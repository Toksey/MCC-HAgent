/**
 * /api/budget — Hermes token usage telemetry / budget tracking
 * Replaces: mc-storage (readMcJson/writeMcJson on MC_BUDGET_FILE) → telemetry-based
 */
import { NextResponse } from 'next/server';
import { telemetry } from '@/lib/hermes';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// In-memory budget store
const budgetState = {
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

export async function GET() {
  try {
    const health = await telemetry.getSystemHealth();

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
    const body = await req.json();

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

    return NextResponse.json({ ok: true, budget: budgetState });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update budget', detail: String(error) },
      { status: 500 }
    );
  }
}
