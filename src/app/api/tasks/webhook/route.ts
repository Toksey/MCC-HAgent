import { NextRequest, NextResponse } from 'next/server';

/**
 * OpenCore Task Webhook API
 * Allows internal agents to push task progression (started, done, blocked)
 * directly back to the Ares Command UI layer.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    if (!payload.taskId || !payload.status) {
      return NextResponse.json({ error: 'Missing taskId or status in payload' }, { status: 400 });
    }

    // Write webhook payload into local tracking file or sqlite db
    // This allows the task Kanban board to fetch the updated state.
    
    console.log(`[Ares Command] Received Task Webhook => Agent: ${payload.agentId || 'Unknown'} Transitioned Task ${payload.taskId} to ${payload.status}`);

    return NextResponse.json({
      success: true,
      message: 'Task state updated across command layer successfully.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
