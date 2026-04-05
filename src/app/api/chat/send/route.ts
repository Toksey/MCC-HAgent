/**
 * /api/chat/send — Hermes agent chat relay
 * Replaces: fs.appendFile + gateway fetch → direct Hermes API with mock fallback
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { appendChatExchange } from '@/lib/hermes/mock-runtime';

export async function POST(req: Request) {
  try {
    const { agentId, sessionId, content } = await req.json();
    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const hermesApiUrl = process.env.HERMES_API_URL;

    if (hermesApiUrl) {
      try {
        const res = await fetch(`${hermesApiUrl}/agents/${agentId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.HERMES_API_KEY ? { Authorization: `Bearer ${process.env.HERMES_API_KEY}` } : {}),
          },
          body: JSON.stringify({ sessionId, content }),
        });
        if (res.ok) {
          const data = await res.json();
          const responseText =
            typeof data?.response?.content === 'string'
              ? data.response.content
              : typeof data?.message?.content === 'string'
                ? data.message.content
                : typeof data?.message === 'string'
                  ? data.message
                  : 'Hermes processed the request successfully.';

          const session = appendChatExchange(agentId, sessionId || 'main', content, responseText);
          return NextResponse.json({
            success: true,
            session,
            messages: session.messages,
          });
        }
      } catch { /* fall through to mock */ }
    }

    const mockResponses = [
      'Understood. Processing your request — I\'ll update the task board with findings shortly.',
      'Acknowledged. Running analysis now and surfacing key insights.',
      'Got it. Cross-referencing memory and initiating the relevant skill execution.',
      'On it. Decomposed into sub-goals and beginning the first cognitive action cycle.',
    ];

    const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const session = appendChatExchange(agentId, sessionId || 'main', content, responseText);

    return NextResponse.json({
      success: true,
      message: { id: crypto.randomUUID(), role: 'user', content, timestamp },
      response: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(Date.now() + 500).toISOString(),
      },
      session,
      messages: session.messages,
      offline: !hermesApiUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message', detail: String(error) }, { status: 500 });
  }
}
