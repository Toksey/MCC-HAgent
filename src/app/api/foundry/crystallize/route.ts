/**
 * /api/foundry/crystallize — Hermes memory crystallization (The Forge)
 * Replaces: mc-storage + readJson → hermes/memory.reflect
 */
import { NextResponse } from 'next/server';
import { agents, memory } from '@/lib/hermes';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, pattern } = body;

    const agentList = agentId ? [await agents.getAgent(agentId)] : await agents.getAgents();

    const results = await Promise.allSettled(
      agentList.map(async agent => {
        const reflection = await memory.reflect(agent.id);
        return {
          agentId: agent.id,
          agentName: agent.name,
          reflection,
          pattern: pattern || 'reflexion',
        };
      })
    );

    const crystallized = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{
        agentId: string;
        agentName: string;
        reflection: Awaited<ReturnType<typeof memory.reflect>>;
        pattern: string;
      }>).value);

    return NextResponse.json({
      ok: true,
      crystallized,
      summary: {
        agentsProcessed: crystallized.length,
        totalInsights: crystallized.reduce((sum, c) => sum + c.reflection.insights.length, 0),
        crystalizedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
