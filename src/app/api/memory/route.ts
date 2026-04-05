/**
 * /api/memory — OpenBrain connection configuration
 * Replaces: readJson/writeFile on OPENCLAW_CONFIG → env-based config + hermes/memory
 */
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Configuration is now environment-based, not stored in openclaw.json
    const url = process.env.OPENBRAIN_URL || '';
    const enabled = url.length > 0;

    return NextResponse.json({
      url,
      enabled,
      hermesApiUrl: process.env.HERMES_API_URL || '',
      mode: enabled ? 'connected' : 'mock',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { url, enabled } = await req.json();

    if (!enabled) {
      return NextResponse.json({
        success: true,
        message: 'OpenBrain disconnected. Running in mock mode.',
        mode: 'mock',
      });
    }

    if (!url) {
      return NextResponse.json(
        { error: 'OPENBRAIN_URL is required to enable OpenBrain' },
        { status: 400 }
      );
    }

    // In Hermes architecture, connection is managed via OPENBRAIN_URL env var
    // Inform the user to set it in .env.local
    return NextResponse.json({
      success: true,
      message: `Set OPENBRAIN_URL="${url}" in your .env.local file and restart the server to activate OpenBrain.`,
      mode: 'pending-restart',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
