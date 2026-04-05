/**
 * /api/eval — Hermes agent evaluation framework
 * Replaces: mc-storage readMcJson → telemetry-based evaluation
 */
import { NextResponse } from 'next/server';
import { agents, telemetry } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (agentId) {
      const [agent, state, logs] = await Promise.all([
        agents.getAgent(agentId),
        telemetry.getState(agentId),
        telemetry.getLogs(agentId, 20),
      ]);

      const actionCounts = logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        agentId,
        agentName: agent.name,
        metrics: {
          errorRate: state.errorRate,
          latencyMs: state.latencyMs,
          uptimeSeconds: state.uptimeSeconds,
          memoryCount: state.memoryCount,
          activeGoals: state.activeGoals,
          sessionCount: agent.sessionCount,
          actionBreakdown: actionCounts,
        },
        score: Math.max(0, 100 - state.errorRate * 10),
        grade: state.errorRate < 1 ? 'A' : state.errorRate < 5 ? 'B' : state.errorRate < 10 ? 'C' : 'D',
      });
    }

    // System-wide evaluation
    const health = await telemetry.getSystemHealth();
    return NextResponse.json({
      systemScore: Math.max(0, 100 - health.errorRateLast24h * 10),
      health,
      grade: health.errorRateLast24h < 1 ? 'A' : health.errorRateLast24h < 5 ? 'B' : 'C',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
