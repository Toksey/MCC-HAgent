/**
 * /api/playbooks — Hermes cognitive playbooks
 * Replaces: readDirectory + readMarkdown (filesystem) → in-memory playbook store
 */
import { NextResponse } from 'next/server';

const PLAYBOOKS = [
  {
    id: 'pb_onboarding',
    name: 'Agent Onboarding',
    description: 'Standard workflow for configuring and activating a new Hermes agent',
    steps: ['Set identity & role', 'Configure model', 'Enable skills', 'Define initial goals', 'Set autonomy level', 'Activate loop'],
    tags: ['setup', 'onboarding'],
    author: 'system',
    version: '1.0',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'pb_incident',
    name: 'Incident Response',
    description: 'Coordinated multi-agent response to production incidents',
    steps: ['Alert detection', 'Agent mobilization (Atlas)', 'Root cause analysis (Apex)', 'Impact assessment (Iris)', 'Fix deployment', 'Post-mortem & memory update'],
    tags: ['incident', 'devops', 'production'],
    author: 'system',
    version: '2.1',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'pb_research',
    name: 'Market Research Sprint',
    description: 'Structured research workflow with synthesis and report generation',
    steps: ['Define research scope', 'Web research (Iris)', 'Data analysis', 'Competitive benchmarking', 'Insight synthesis', 'Report generation'],
    tags: ['research', 'analysis'],
    author: 'system',
    version: '1.2',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

let playbookStore = [...PLAYBOOKS];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const filtered = tag
      ? playbookStore.filter(p => p.tags.includes(tag))
      : playbookStore;

    return NextResponse.json({
      playbooks: filtered,
      summary: { total: filtered.length, tags: [...new Set(playbookStore.flatMap(p => p.tags))] },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), playbooks: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const playbook = {
      id: `pb_${Math.random().toString(36).slice(2, 9)}`,
      name: body.name || 'New Playbook',
      description: body.description || '',
      steps: body.steps || [],
      tags: body.tags || [],
      author: body.author || 'user',
      version: '1.0',
      createdAt: new Date().toISOString(),
    };
    playbookStore.push(playbook);
    return NextResponse.json(playbook, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    playbookStore = playbookStore.filter(p => p.id !== id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
