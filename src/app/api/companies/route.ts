/**
 * /api/companies — Projects/Workspaces in Hermes terminology
 * Replaces: mc-storage (readMcJson/writeMcJson/appendMcRecord) → in-memory state
 *
 * In the Hermes architecture, "companies" become "workspaces" or "projects".
 * State is managed server-side in memory (or persisted via Hermes API when connected).
 */
import { NextResponse } from 'next/server';

// In-memory workspace store (survives hot-reload in dev via module scope)
let workspaces: Array<{
  id: string;
  name: string;
  mission?: string;
  goals?: string[];
  defaultAgentId?: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'ws_default',
    name: 'Main Workspace',
    mission: 'Primary cognitive operations workspace',
    goals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let activeWorkspaceId: string | null = 'ws_default';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  try {
    return NextResponse.json({
      companies: workspaces,
      activeCompanyId: activeWorkspaceId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load workspaces', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();

    const workspace = {
      id: uid('ws'),
      name: body.name || 'New Workspace',
      mission: body.mission || '',
      goals: body.goals || [],
      defaultAgentId: body.defaultAgentId,
      createdAt: now,
      updatedAt: now,
    };

    workspaces.push(workspace);

    if (workspaces.length === 1) {
      activeWorkspaceId = workspace.id;
    }

    return NextResponse.json({ ok: true, company: workspace });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create workspace', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (body.switchTo) {
      activeWorkspaceId = body.switchTo;
      return NextResponse.json({ ok: true, activeCompanyId: body.switchTo });
    }

    if (body.id) {
      workspaces = workspaces.map(ws =>
        ws.id === body.id
          ? { ...ws, ...body, id: ws.id, updatedAt: new Date().toISOString() }
          : ws
      );
      const updated = workspaces.find(ws => ws.id === body.id);
      if (!updated) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      return NextResponse.json({ ok: true, company: updated });
    }

    return NextResponse.json({ error: 'Provide id or switchTo' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workspace', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const exists = workspaces.find(ws => ws.id === id);
    if (!exists) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    workspaces = workspaces.filter(ws => ws.id !== id);

    if (activeWorkspaceId === id) {
      activeWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workspace', detail: String(error) },
      { status: 500 }
    );
  }
}
