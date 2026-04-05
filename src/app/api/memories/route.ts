/**
 * /api/memories — Hermes/OpenBrain memory explorer
 * Replaces: readDirectory(memoryDir) + readMarkdown → hermes/memory
 */
import { NextResponse } from 'next/server';
import { memory } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const query = searchParams.get('query');

    let entries;

    if (agentId && query) {
      // Semantic search
      entries = await memory.query(agentId, { query, limit: 20 });
    } else if (agentId) {
      // Agent-specific memories
      entries = await memory.getMemories(agentId);
    } else {
      // All memories (system-wide view)
      entries = await memory.getAll();
    }

    const today = new Date().toISOString().split('T')[0];
    const modifiedToday = entries.filter(
      m => m.updatedAt.split('T')[0] === today
    ).length;

    return NextResponse.json({
      memories: entries,
      summary: {
        total: entries.length,
        modifiedToday,
        byType: {
          episodic: entries.filter(m => m.type === 'episodic').length,
          semantic: entries.filter(m => m.type === 'semantic').length,
          procedural: entries.filter(m => m.type === 'procedural').length,
          reflection: entries.filter(m => m.type === 'reflection').length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), memories: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, content, type, tags } = await req.json();
    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    const entry = await memory.store(agentId, { content, type, tags });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { memoryId, ...updates } = await req.json();
    if (!memoryId) {
      return NextResponse.json({ error: 'memoryId is required' }, { status: 400 });
    }

    const updated = await memory.update(memoryId, updates);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get('id');
    if (!memoryId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await memory.delete(memoryId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
