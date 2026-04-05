/**
 * /api/inbox — Hermes agent approval queue
 * Replaces: mc-storage (readMcJson/appendMcRecord) → in-memory approval queue
 */
import { NextResponse } from 'next/server';

const inboxItems: Array<{
  id: string;
  companyId: string;
  kind: 'approve-action' | 'hire-request' | 'budget-approval' | 'system';
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  origin: 'agent' | 'human' | 'system';
  originAgentId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
}> = [
  {
    id: 'in_001',
    companyId: 'ws_default',
    kind: 'approve-action',
    title: 'Deploy to production: auth middleware update',
    body: 'Agent Apex is requesting approval to deploy auth middleware changes to production. Changes include JWT key rotation and PKCE flow upgrade.',
    status: 'pending',
    origin: 'agent',
    originAgentId: 'agent_apex',
    payload: { action: 'deploy', environment: 'production', service: 'auth-middleware' },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'in_002',
    companyId: 'ws_default',
    kind: 'budget-approval',
    title: 'Budget threshold alert: 80% utilized',
    body: 'Monthly budget utilization has reached 80% ($400/$500). Agent Apex is the top spender at $185. Approve to continue or adjust caps.',
    status: 'pending',
    origin: 'system',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

function uid() {
  return `in_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  try {
    const sorted = [...inboxItems].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const summary = {
      total: sorted.length,
      pending: sorted.filter(i => i.status === 'pending').length,
      approved: sorted.filter(i => i.status === 'approved').length,
      rejected: sorted.filter(i => i.status === 'rejected').length,
    };

    return NextResponse.json({ items: sorted, summary });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load inbox', detail: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = {
      id: uid(),
      companyId: body.companyId || 'ws_default',
      kind: (body.kind || 'system') as 'approve-action' | 'hire-request' | 'budget-approval' | 'system',
      title: body.title || 'Untitled',
      body: body.body || '',
      status: 'pending' as const,
      origin: (body.origin || 'human') as 'agent' | 'human' | 'system',
      originAgentId: body.originAgentId,
      payload: body.payload,
      createdAt: new Date().toISOString(),
    };
    inboxItems.push(item);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inbox item', detail: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !['approve', 'reject', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'id and action (approve|reject|dismiss) required' }, { status: 400 });
    }

    const statusMap: Record<string, 'approved' | 'rejected' | 'dismissed'> = {
      approve: 'approved', reject: 'rejected', dismiss: 'dismissed',
    };

    const item = inboxItems.find(i => i.id === id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    item.status = statusMap[action];
    item.resolvedAt = new Date().toISOString();

    if (action === 'approve' && item.kind === 'hire-request' && item.payload) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:34000';
        await fetch(`${baseUrl}/api/agents/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inbox item', detail: String(error) }, { status: 500 });
  }
}
