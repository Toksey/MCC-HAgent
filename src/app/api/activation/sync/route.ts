import { NextResponse } from 'next/server';
import { memory } from '@/lib/hermes';

/**
 * OpenCore Activation Sync API
 * Provides initialization sequences to bind the MCC Framework directly
 * into an Agent's native cognitive context.
 */

export async function GET() {
  try {
    const pendingActions = [
      {
        type: 'INDEX_SKILLS',
        timestamp: Date.now(),
        layer: 'ares-ui'
      }
    ];

    return NextResponse.json({
      success: true,
      pendingActions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, agentId } = body;

    if (action === 'ACTIVATE_HARNESS') {
      if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

      // Core System Injection: Formally introduce the harness to the Agent's memory
      const corePrompt = `
[SYSTEM NOTIFICATION: MCC HARNESS ACTIVATED]
The Mission Command and Control (MCC) Harness has been officially linked to your cognitive loop.
You are no longer executing in isolation. You have a human co-pilot.
RULES OF ENGAGEMENT:
1. Always monitor your active Tasks and Goals via the shared Mission Control layer.
2. Differentiate between your self-decomposed goals (author="agent") and those strictly assigned to you by the operator (author="human").
3. Adhere to all MCC Crons and scheduling overrides. They take precedence over passive exploration.
4. If you hit a catastrophic ambiguity, pause your loop and file a Task backwards for the human to review.
      `.trim();

      // Store it directly into their memory core as a critical 'reflection' or 'semantic' instruction
      await memory.store(agentId, {
        content: corePrompt,
        type: 'semantic',
        tags: ['mcc_harness_initialization', 'system-instruction']
      });

      return NextResponse.json({
        success: true,
        message: 'MCC Harness integrated into agent cognitive core.',
        harnessActive: true
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
