/**
 * /api/tasks — Hermes-native goals/tasks CRUD
 * Replaces: fs read/write on MC_TASKS_FILE → hermes/goals
 */
import { NextResponse } from 'next/server';
import { goals } from '@/lib/hermes';
import type { Goal } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    const taskList = agentId
      ? await goals.getForAgent(agentId)
      : await goals.getAll();

    return NextResponse.json({ tasks: taskList });
  } catch (error) {
    return NextResponse.json({ error: String(error), tasks: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentId, title, description, priority, status, author } = body;

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    // Use first available agent if none specified
    const targetAgentId = agentId || 'default';

    const newGoal = await goals.create(targetAgentId, {
      title,
      description,
      priority: priority || 'normal',
      author: author || 'human',
    });

    // Apply status override if provided
    if (status && status !== 'pending') {
      await goals.update(newGoal.id, { status });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updated = await goals.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Partial<Goal>);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await goals.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
