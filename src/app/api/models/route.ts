/**
 * /api/models — Hermes model registry
 * Replaces: readJson(OPENCLAW_CONFIG) → hermes/agents (model info lives per-agent)
 */
import { NextResponse } from 'next/server';
import { agents } from '@/lib/hermes';

// Hermes-native model registry (replaces openclaw.json providers section)
const HERMES_MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, supportsVision: true },
      { id: 'o3', name: 'o3', contextWindow: 200000, supportsReasoning: true },
      { id: 'o4-mini', name: 'o4 Mini', contextWindow: 200000, supportsReasoning: true },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, supportsVision: true },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', contextWindow: 200000, supportsVision: true },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', contextWindow: 200000, supportsVision: true },
    ],
  },
  google: {
    name: 'Google',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1000000, supportsVision: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, supportsVision: true },
    ],
  },
  local: {
    name: 'Local / Ollama',
    models: [
      { id: 'llama3.3', name: 'Llama 3.3', contextWindow: 128000 },
      { id: 'qwen3', name: 'Qwen 3', contextWindow: 32768 },
      { id: 'mistral', name: 'Mistral', contextWindow: 32768 },
    ],
  },
};

export async function GET() {
  try {
    const agentList = await agents.getAgents();

    const agentModels = agentList.map(a => ({
      id: a.id,
      name: a.name,
      emoji: a.emoji,
      model: a.model,
      provider: a.provider,
    }));

    return NextResponse.json({
      providers: HERMES_MODEL_PROVIDERS,
      agentModels,
      defaults: {
        primary: 'gpt-4o',
        fallbacks: ['claude-sonnet-4-20250514', 'gemini-2.5-pro'],
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { action, agentId, model } = body;

    if (action === 'setAgentModel' && agentId && model) {
      const updated = await agents.updateAgent(agentId, { model });
      return NextResponse.json({ ok: true, agent: updated });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
