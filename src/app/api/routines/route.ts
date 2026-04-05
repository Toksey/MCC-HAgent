/**
 * /api/routines — Hermes scheduled routines (alias for /api/cron)
 * Replaces: mc-storage readMcJson/writeMcJson on MC_ROUTINES_FILE
 */
import { NextResponse } from 'next/server';
import { goals } from '@/lib/hermes';

// Routines in Hermes are recurring goal templates
let routines: Array<{
  id: string;
  name: string;
  description: string;
  schedule: string;
  agentId?: string;
  enabled: boolean;
  lastRun?: string;
  createdAt: string;
}> = [
  {
    id: 'rt_daily_standup',
    name: 'Daily Standup Report',
    description: 'Each agent generates a status update for their active goals',
    schedule: '0 9 * * 1-5',
    enabled: true,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'rt_weekly_review',
    name: 'Weekly Goal Review',
    description: 'Review and reprioritize goals; archive completed, escalate blocked',
    schedule: '0 10 * * 1',
    enabled: true,
    lastRun: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'rt_memory_consolidation',
    name: 'Memory Consolidation',
    description: 'Compress and reinforce high-weight memories, prune stale entries',
    schedule: '0 2 * * *',
    enabled: true,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

export async function GET() {
  try {
    const allGoals = await goals.getAll();
    const activeGoals = allGoals.filter(g => g.status === 'active' || g.status === 'pending');

    return NextResponse.json({
      routines,
      summary: {
        total: routines.length,
        enabled: routines.filter(r => r.enabled).length,
        activeGoals: activeGoals.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), routines: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const routine = {
      id: `rt_${Math.random().toString(36).slice(2, 9)}`,
      name: body.name || 'New Routine',
      description: body.description || '',
      schedule: body.schedule || '0 9 * * *',
      agentId: body.agentId,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    routines.push(routine);
    return NextResponse.json({ ok: true, routine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    routines = routines.map(r => r.id === id ? { ...r, ...updates } : r);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    routines = routines.filter(r => r.id !== id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
