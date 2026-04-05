/**
 * /api/agents/files — Agent workspace file browser
 * Replaces: readDirectory(AGENTS_DIR) → hermes/agents metadata
 */
import { NextResponse } from 'next/server';
import { agents, memory } from '@/lib/hermes';
import { getWorkspaceOverride, saveWorkspaceOverride } from '@/lib/hermes/mock-runtime';

function buildVirtualFileContent(
  filename: string,
  agent: Awaited<ReturnType<typeof agents.getAgent>>,
  agentMemories: Awaited<ReturnType<typeof memory.getMemories>>
) {
  switch (filename) {
    case 'IDENTITY.md':
      return `# Identity\n\n- Name: ${agent.name}\n- Emoji: ${agent.emoji}\n- Role: ${agent.role}\n- Model: ${agent.model}\n- Provider: ${agent.provider || 'hermes'}\n- Status: ${agent.status}\n`;
    case 'PERSONA.md':
      return `# Persona\n\n${agent.name} operates with ${agent.autonomyLevel} autonomy and a ${agent.loopState} cognitive loop.\n\n## Behavioral Signals\n${agentMemories.slice(0, 5).map((entry) => `- ${entry.content}`).join('\n') || '- No memory-derived persona signals available yet.'}\n`;
    case 'RULES.md':
      return `# Rules\n\n- Respect assigned autonomy policy: ${agent.autonomyLevel}\n- Prefer enabled skills only: ${agent.skills.join(', ') || 'none'}\n- Keep goal progress synchronized with Hermes telemetry\n- Escalate when loop state enters error or paused\n`;
    case 'HEARTBEAT.md':
      return `# Heartbeat\n\n- Loop State: ${agent.loopState}\n- Current Status: ${agent.status}\n- Active Goals: ${agent.goals.length}\n- Memory Entries: ${agentMemories.length}\n- Session Count: ${agent.sessionCount}\n`;
    case 'SOUL.md':
      return `# SOUL — ${agent.name}\n\n${agent.role}\n\n${agent.name} runs on ${agent.model} with ${agent.autonomyLevel} autonomy in the Hermes cognitive framework.\n`;
    case 'GOALS.json':
      return JSON.stringify(agent.goals, null, 2);
    case 'SKILLS.json':
      return JSON.stringify(agent.skills, null, 2);
    case 'POLICY.json':
      return JSON.stringify(
        {
          autonomyLevel: agent.autonomyLevel,
          loopState: agent.loopState,
          status: agent.status,
        },
        null,
        2
      );
    default:
      return '';
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const filename = searchParams.get('file');
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

    const [agent, agentMemories] = await Promise.all([
      agents.getAgent(agentId),
      memory.getMemories(agentId),
    ]);

    if (filename) {
      const override = getWorkspaceOverride(agentId, filename);
      const content = override?.content ?? buildVirtualFileContent(filename, agent, agentMemories);
      return NextResponse.json({
        file: filename,
        content,
        isGlobal: false,
        modifiedAt: override?.updatedAt ?? agent.updatedAt,
      });
    }

    // Represent Hermes cognitive structures as virtual "files"
    const virtualFiles = [
      {
        name: 'IDENTITY.md',
        type: 'identity',
        description: 'Agent identity and role profile',
        sizeBytes: 384,
        icon: '🪪',
        modifiedAt: getWorkspaceOverride(agentId, 'IDENTITY.md')?.updatedAt || agent.updatedAt,
      },
      {
        name: 'PERSONA.md',
        type: 'persona',
        description: 'Behavioral patterns and working style',
        sizeBytes: 512,
        icon: '🎭',
        modifiedAt: getWorkspaceOverride(agentId, 'PERSONA.md')?.updatedAt || agent.updatedAt,
      },
      {
        name: 'RULES.md',
        type: 'rules',
        description: 'Operational rules and constraints',
        sizeBytes: 256,
        icon: '📏',
        modifiedAt: getWorkspaceOverride(agentId, 'RULES.md')?.updatedAt || agent.updatedAt,
      },
      {
        name: 'HEARTBEAT.md',
        type: 'heartbeat',
        description: 'Loop status and execution heartbeat',
        sizeBytes: 220,
        icon: '💓',
        modifiedAt: getWorkspaceOverride(agentId, 'HEARTBEAT.md')?.updatedAt || agent.updatedAt,
      },
      {
        name: 'SOUL.md',
        type: 'identity',
        description: 'Cognitive identity and role definition',
        sizeBytes: 512,
        icon: '🧬',
        modifiedAt: agent.updatedAt,
      },
      {
        name: 'GOALS.json',
        type: 'goals',
        description: `${agent.goals.length} active goals`,
        sizeBytes: JSON.stringify(agent.goals).length,
        icon: '🎯',
        modifiedAt: agent.updatedAt,
      },
      {
        name: 'MEMORY.db',
        type: 'memory',
        description: `${agentMemories.length} memory entries (OpenBrain)`,
        sizeBytes: agentMemories.reduce((sum, m) => sum + m.content.length, 0),
        icon: '🧠',
        modifiedAt: agentMemories[0]?.updatedAt || agent.updatedAt,
      },
      {
        name: 'SKILLS.json',
        type: 'skills',
        description: `${agent.skills.length} registered skills`,
        sizeBytes: JSON.stringify(agent.skills).length,
        icon: '⚡',
        modifiedAt: agent.updatedAt,
      },
      {
        name: 'POLICY.json',
        type: 'policy',
        description: `Autonomy: ${agent.autonomyLevel}`,
        sizeBytes: 256,
        icon: '🛡️',
        modifiedAt: agent.updatedAt,
      },
    ];

    return NextResponse.json({
      files: virtualFiles,
      agent: {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        model: agent.model,
      },
      total: virtualFiles.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const agentId = body.agentId as string | undefined;
    const filename = body.file as string | undefined;
    const content = body.content as string | undefined;

    if (!agentId || !filename || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'agentId, file, and content are required' },
        { status: 400 }
      );
    }

    const saved = saveWorkspaceOverride(agentId, filename, content);
    return NextResponse.json({
      ok: true,
      file: filename,
      modifiedAt: saved.updatedAt,
      content: saved.content,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
