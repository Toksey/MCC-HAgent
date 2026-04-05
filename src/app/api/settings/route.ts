/**
 * /api/settings — Hermes system settings
 * Replaces: readJson/writeFile on OPENCLAW_CONFIG → env-based Hermes config
 */
import { NextResponse } from 'next/server';
import { telemetry } from '@/lib/hermes';

export async function GET() {
  try {
    const health = await telemetry.getSystemHealth();

    return NextResponse.json({
      meta: {
        name: 'Hermes Command',
        version: '1.0.0',
        mode: process.env.HERMES_API_URL ? 'connected' : 'mock',
      },
      hermes: {
        apiUrl: process.env.HERMES_API_URL || '',
        apiKeyConfigured: !!process.env.HERMES_API_KEY,
        openbrainUrl: process.env.OPENBRAIN_URL || '',
      },
      health,
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
    // In Hermes architecture, settings are managed via .env.local
    // This endpoint acknowledges the request and provides guidance
    const body = await req.json();
    console.log('[hermes-settings] Settings update requested:', Object.keys(body));

    return NextResponse.json({
      ok: true,
      message: 'Settings acknowledged. Update HERMES_API_URL, HERMES_API_KEY, and OPENBRAIN_URL in .env.local to configure the Hermes runtime.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Hermes runtime commands (replaces `openclaw <command>`)
  try {
    const { command } = await req.json();
    const allowed = ['health', 'status', 'version'];

    if (!allowed.includes(command)) {
      return NextResponse.json(
        { error: `Command "${command}" is not allowed. Allowed: ${allowed.join(', ')}` },
        { status: 400 }
      );
    }

    if (command === 'health' || command === 'status') {
      const health = await telemetry.getSystemHealth();
      return NextResponse.json({ ok: true, command, data: health });
    }

    return NextResponse.json({
      ok: true,
      command,
      stdout: 'Hermes Command v1.0.0',
      stderr: '',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
