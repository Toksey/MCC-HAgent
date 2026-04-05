/**
 * /api/tasks/attachments — Task attachment metadata
 * Replaces: readDirectory(openclaw-paths) → Hermes goals attachments
 */
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    // In Hermes, attachments are stored as memory entries tagged to a goal
    return NextResponse.json({ attachments: [], taskId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      ok: true,
      attachment: {
        id: `att_${Math.random().toString(36).slice(2, 9)}`,
        taskId: body.taskId,
        name: body.name || 'attachment',
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
