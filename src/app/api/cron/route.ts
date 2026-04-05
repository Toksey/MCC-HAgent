/**
 * /api/cron — Hermes scheduled routines
 * Replaces: readJson(CRON_JOBS) → goals-based scheduled tasks
 * In Hermes, cron jobs are represented as routines tied to goals.
 */
import { NextResponse } from 'next/server';

// Mock scheduled routines (powered by the Hermes goal scheduler)
const HERMES_ROUTINES = [
  {
    id: 'routine_memory_reflect',
    name: 'Memory Reflection',
    description: 'All agents reflect on recent memories and synthesize insights',
    schedule: '0 3 * * *',
    humanSchedule: 'Daily at 3:00 AM',
    agentId: null, // system-wide
    enabled: true,
    type: 'reflect',
    state: { lastStatus: 'ok', lastRun: new Date(Date.now() - 86400000).toISOString(), consecutiveErrors: 0 },
  },
  {
    id: 'routine_goal_review',
    name: 'Goal Progress Review',
    description: 'Review and update progress on all active goals',
    schedule: '0 9 * * 1',
    humanSchedule: 'Every Monday at 9:00 AM',
    agentId: null,
    enabled: true,
    type: 'review',
    state: { lastStatus: 'ok', lastRun: new Date(Date.now() - 7 * 86400000).toISOString(), consecutiveErrors: 0 },
  },
  {
    id: 'routine_skill_audit',
    name: 'Skill Registry Audit',
    description: 'Scan all registered skills for security and performance issues',
    schedule: '0 2 * * 0',
    humanSchedule: 'Every Sunday at 2:00 AM',
    agentId: null,
    enabled: true,
    type: 'audit',
    state: { lastStatus: 'ok', lastRun: new Date(Date.now() - 2 * 86400000).toISOString(), consecutiveErrors: 0 },
  },
];

let routines = [...HERMES_ROUTINES];

export async function GET() {
  try {
    const summary = {
      total: routines.length,
      enabled: routines.filter(j => j.enabled).length,
      disabled: routines.filter(j => !j.enabled).length,
      failed: routines.filter(j => (j.state?.consecutiveErrors ?? 0) > 0).length,
      ok: routines.filter(j => j.enabled && j.state?.lastStatus === 'ok').length,
    };

    return NextResponse.json({ jobs: routines, summary });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load routines', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, enabled } = body;
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'id and enabled required' }, { status: 400 });
    }

    routines = routines.map(j => j.id === id ? { ...j, enabled } : j);
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

    routines = routines.filter(j => j.id !== id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
