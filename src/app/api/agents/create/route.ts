/**
 * /api/agents/create — Hermes-native agent creation
 * Replaces: fs.writeFile(OPENCLAW_CONFIG) + fs.mkdir(AGENTS_DIR) → hermes/agents.createAgent
 */
import { NextResponse } from 'next/server';
import { agents } from '@/lib/hermes';
import type { AgentCreatePayload, AutonomyLevel } from '@/lib/hermes';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, emoji, role, model, autonomyLevel, skills: agentSkills } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Missing required fields: name, role' }, { status: 400 });
    }

    const payload: AgentCreatePayload = {
      name,
      emoji: emoji || '🤖',
      role,
      model: model || 'gpt-4o',
      autonomyLevel: (autonomyLevel || 'balanced') as AutonomyLevel,
      skills: agentSkills || [],
    };

    // If an explicit ID was requested, include it (some adapters support it)
    if (id) (payload as unknown as Record<string, unknown>).id = id;

    const newAgent = await agents.createAgent(payload);
    return NextResponse.json({ success: true, agent: newAgent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent', detail: String(error) },
      { status: 500 }
    );
  }
}
