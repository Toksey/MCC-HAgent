/**
 * /api/agents/sessions — Hermes agent session history
 * Replaces: readDirectory(AGENTS_DIR/agentId/sessions) → hermes/telemetry logs
 */
import { NextResponse } from 'next/server';
import { telemetry } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

    const [agentState, recentLogs] = await Promise.all([
      telemetry.getState(agentId),
      telemetry.getLogs(agentId, 50),
    ]);

    // Represent cognitive action batches as "sessions"
    const sessions = recentLogs.map(log => ({
      id: log.id,
      name: `${log.type}-${log.timestamp.slice(0, 10)}`,
      type: log.type,
      phase: log.type,
      content: log.content,
      durationMs: log.durationMs,
      timestamp: log.timestamp,
      modifiedAt: log.timestamp,
      size: log.content.length,
      sizeBytes: log.content.length,
    }));

    return NextResponse.json({
      sessions,
      total: sessions.length,
      agentState: {
        loopPhase: agentState.loopPhase,
        uptimeSeconds: agentState.uptimeSeconds,
        errorRate: agentState.errorRate,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
