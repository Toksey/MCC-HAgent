/**
 * /api/skills — Hermes skill registry
 * Replaces: readDirectory(WORKSPACE_SKILLS_DIR) + readMarkdown → hermes/skills
 */
import { NextResponse } from 'next/server';
import { skills, mcp } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || 'local'; // local | registry | mcp | all

    const [allSkills, mcpTools] = await Promise.all([
      skills.list(),
      mcp.listTools(),
    ]);

    const filtered = source === 'all'
      ? allSkills
      : source === 'mcp'
        ? allSkills.filter(s => s.source === 'mcp')
        : source === 'registry'
          ? allSkills.filter(s => s.source === 'registry')
          : allSkills.filter(s => s.source === 'local');

    return NextResponse.json({
      skills: filtered,
      mcpTools,
      summary: {
        total: allSkills.length,
        ready: allSkills.filter(s => s.status === 'ready').length,
        disabled: allSkills.filter(s => s.status === 'disabled').length,
        mcpCount: mcpTools.filter(t => t.enabled).length,
        bySource: {
          local: allSkills.filter(s => s.source === 'local').length,
          registry: allSkills.filter(s => s.source === 'registry').length,
          mcp: allSkills.filter(s => s.source === 'mcp').length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      skills: [],
      summary: { total: 0, ready: 0, disabled: 0, mcpCount: 0 },
    });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const newSkill = await skills.register(payload);
    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
