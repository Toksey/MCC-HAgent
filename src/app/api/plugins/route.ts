/**
 * /api/plugins — Hermes skill/MCP plugin registry
 * Replaces: readDirectory + readMarkdown → hermes/skills + mcp
 */
import { NextResponse } from 'next/server';
import { skills, mcp } from '@/lib/hermes';

export async function GET() {
  try {
    const [allSkills, mcpTools] = await Promise.all([
      skills.list(),
      mcp.listTools(),
    ]);

    const plugins = [
      ...allSkills.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: 'skill' as const,
        version: s.version,
        author: s.author,
        source: s.source,
        tags: s.tags,
        riskLevel: s.riskLevel,
        enabled: s.status === 'ready',
        executionCount: s.executionCount,
      })),
      ...mcpTools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: 'mcp' as const,
        version: '1.0',
        author: t.source,
        source: t.source,
        tags: [],
        riskLevel: t.riskLevel,
        enabled: t.enabled,
        executionCount: 0,
      })),
    ];

    return NextResponse.json({
      plugins,
      summary: {
        total: plugins.length,
        skills: allSkills.length,
        mcpTools: mcpTools.length,
        enabled: plugins.filter(p => p.enabled).length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), plugins: [] }, { status: 500 });
  }
}
