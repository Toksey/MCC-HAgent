/**
 * /api/channels — Hermes communication channel config
 * Replaces: readJson(OPENCLAW_CONFIG) + readDirectory(DELIVERY_QUEUE_DIR)
 * In Hermes, channels are configured via env vars and managed by the agent runtime.
 */
import { NextResponse } from 'next/server';
import { telemetry } from '@/lib/hermes';

export async function GET() {
  try {
    const health = await telemetry.getSystemHealth();

    return NextResponse.json({
      channels: {
        whatsapp: {
          enabled: false,
          dmPolicy: 'allowlist',
          selfChatMode: false,
          groupPolicy: 'allowlist',
          contacts: [],
          allowFrom: [],
          debounceMs: 0,
          mediaMaxMb: 50,
        },
        telegram: {
          enabled: false,
          dmPolicy: 'pairing',
          streaming: 'partial',
          groupPolicy: 'allowlist',
        },
        hermes: {
          enabled: true,
          activeAgents: health.activeAgents,
          mode: process.env.HERMES_API_URL ? 'connected' : 'mock',
        },
      },
      queue: [],
      summary: {
        queueTotal: 0,
        queueByChannel: { hermes: health.activeAgents },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT() {
  // Channel config is managed via env vars in Hermes architecture
  return NextResponse.json({
    ok: true,
    message: 'Channel configuration is managed via environment variables in Hermes Command.',
  });
}
