/**
 * /api/agents — Hermes-native agent list and update
 * Replaces: readJson(OPENCLAW_CONFIG) + readDirectory(AGENTS_DIR) → hermes/agents
 */
import { NextRequest, NextResponse } from 'next/server';
import { agents, telemetry } from '@/lib/hermes';

const KNOWN_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'o3', name: 'o3', provider: 'openai' },
  { id: 'o4-mini', name: 'o4 Mini', provider: 'openai' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', provider: 'anthropic' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'llama3.3', name: 'Llama 3.3', provider: 'local' },
];

function inferProvider(model: string) {
  if (model.startsWith('gpt-') || model === 'o3' || model === 'o4-mini') return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  return 'local';
}

export async function GET() {
  try {
    const [agentList, health] = await Promise.all([
      agents.getAgents(),
      telemetry.getSystemHealth(),
    ]);

    const modelMap = new Map(KNOWN_MODELS.map((model) => [model.id, model]));
    for (const agent of agentList) {
      if (!modelMap.has(agent.model)) {
        modelMap.set(agent.model, {
          id: agent.model,
          name: agent.model,
          provider: agent.provider || inferProvider(agent.model),
        });
      }
    }

    const hydratedAgents = agentList.map((agent) => ({
      ...agent,
      provider: agent.provider || inferProvider(agent.model),
      workspace: `hermes://agents/${agent.id}/workspace`,
      soulPreview: `${agent.role} · ${agent.autonomyLevel} autonomy · ${agent.loopState} loop`,
      fallbackChain: health.errorRateLast24h > 2 ? 'claude-sonnet-4-20250514' : '',
    }));

    return NextResponse.json({
      agents: hydratedAgents,
      health,
      defaults: {
        model: 'gpt-4o',
        fallbacks: ['claude-sonnet-4-20250514', 'gemini-2.5-pro'],
        autonomyLevel: 'balanced',
        heartbeat: { every: '15s' },
        workspace: 'hermes://workspace',
      },
      modelProviders: Array.from(modelMap.values()),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load agent data', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, loopAction, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Missing agent ID' }, { status: 400 });

    if (loopAction === 'pause') {
      const agent = await agents.pause(id);
      return NextResponse.json({ success: true, agent });
    }

    if (loopAction === 'resume') {
      const agent = await agents.resume(id);
      return NextResponse.json({ success: true, agent });
    }

    if (loopAction === 'step') {
      const agent = await agents.step(id);
      return NextResponse.json({ success: true, agent });
    }

    const updated = await agents.updateAgent(id, updates);
    return NextResponse.json({ success: true, agent: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await agents.deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete agent', detail: String(error) },
      { status: 500 }
    );
  }
}
