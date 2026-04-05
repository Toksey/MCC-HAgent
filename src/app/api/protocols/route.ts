/**
 * /api/protocols — Hermes MCP protocol registry
 * Replaces: readJson(OPENCLAW_CONFIG) mcpServers → hermes/mcp
 */
import { NextResponse } from 'next/server';
import { mcp } from '@/lib/hermes';

export async function GET() {
  try {
    const tools = await mcp.listTools();

    // Group tools by source server as "protocols"
    const protocolMap = new Map<string, typeof tools>();
    for (const tool of tools) {
      const source = tool.source;
      if (!protocolMap.has(source)) protocolMap.set(source, []);
      protocolMap.get(source)!.push(tool);
    }

    const protocols = Array.from(protocolMap.entries()).map(([server, serverTools]) => ({
      id: server,
      name: server,
      type: 'mcp',
      status: 'active',
      toolCount: serverTools.length,
      tools: serverTools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        riskLevel: t.riskLevel,
        enabled: t.enabled,
      })),
    }));

    return NextResponse.json({
      protocols,
      mcpTools: tools,
      summary: {
        total: protocols.length,
        active: protocols.length,
        totalTools: tools.length,
        enabledTools: tools.filter(t => t.enabled).length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), protocols: [] }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { agentId, toolId, enabled } = body;
    if (!agentId || !toolId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'agentId, toolId, enabled required' }, { status: 400 });
    }
    await mcp.setPermission(agentId, toolId, enabled);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
