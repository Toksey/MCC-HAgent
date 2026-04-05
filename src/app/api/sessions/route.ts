/**
 * /api/sessions — Global session listing (all agents)
 * Replaces: readDirectory(AGENTS_DIR) → hermes/telemetry
 */
import { NextResponse } from 'next/server';
import { agents, telemetry } from '@/lib/hermes';
import type { TelemetryState } from '@/lib/hermes';
import {
  ensureChatSession,
  listChatSessions,
  type MockChatMessage,
} from '@/lib/hermes/mock-runtime';

interface SessionSummary {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  sessionCount: number;
  loopPhase: TelemetryState['loopPhase'];
  uptimeSeconds: number;
  errorRate: number;
  memoryCount: number;
  activeGoals: number;
  latencyMs: number;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const sessionId = url.searchParams.get('sessionId');

    if (agentId) {
      const logs = await telemetry.getLogs(agentId, 25);
      const seedMessages: MockChatMessage[] = logs.map((log) => ({
        id: log.id,
        role: log.type === 'observe' ? 'system' : 'assistant',
        content: log.content,
        timestamp: log.timestamp,
      }));

      const primarySession = ensureChatSession(agentId, sessionId || 'main', seedMessages);

      if (sessionId) {
        return NextResponse.json({
          session: {
            id: primarySession.id,
            agentId: primarySession.agentId,
            key: primarySession.key,
            label: primarySession.label,
            sizeBytes: primarySession.sizeBytes,
            modifiedAt: primarySession.modifiedAt,
            createdAt: primarySession.createdAt,
          },
          messages: primarySession.messages,
        });
      }

      const sessions = listChatSessions(agentId).map((session) => ({
        id: session.id,
        agentId: session.agentId,
        key: session.key,
        label: session.label,
        sizeBytes: session.sizeBytes,
        modifiedAt: session.modifiedAt,
        createdAt: session.createdAt,
      }));

      return NextResponse.json({
        sessions,
        total: sessions.length,
      });
    }

    const agentList = await agents.getAgents();

    const sessionData = await Promise.allSettled(
      agentList.map(async (agent): Promise<SessionSummary> => {
        const state = await telemetry.getState(agent.id);
        return {
          agentId: agent.id,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          sessionCount: agent.sessionCount,
          loopPhase: state.loopPhase,
          uptimeSeconds: state.uptimeSeconds,
          errorRate: state.errorRate,
          memoryCount: state.memoryCount,
          activeGoals: state.activeGoals,
          latencyMs: state.latencyMs,
        };
      })
    );

    const sessions: SessionSummary[] = sessionData
      .filter((r): r is PromiseFulfilledResult<SessionSummary> => r.status === 'fulfilled')
      .map(r => r.value);

    const totalSessions = sessions.reduce((sum, s) => sum + s.sessionCount, 0);

    return NextResponse.json({
      sessions,
      summary: {
        totalSessions,
        activeAgents: sessions.filter(s => s.loopPhase !== 'idle' && s.loopPhase !== 'paused').length,
        averageLatencyMs: sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.latencyMs, 0) / sessions.length
          : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), sessions: [] }, { status: 500 });
  }
}
