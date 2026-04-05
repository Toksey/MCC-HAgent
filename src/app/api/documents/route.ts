/**
 * /api/documents — Hermes knowledge documents
 * Replaces: readDirectory + readMarkdown (filesystem) → hermes/memory semantic store
 */
import { NextResponse } from 'next/server';
import { memory } from '@/lib/hermes';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const query = searchParams.get('query');

    // Use memory as the document store — semantic memories act as documents
    const entries = agentId
      ? await memory.getMemories(agentId)
      : await memory.getAll();

    // Filter to semantic/procedural types which are most "document-like"
    const docEntries = query
      ? entries.filter(m =>
          m.content.toLowerCase().includes(query.toLowerCase()) ||
          m.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        )
      : entries.filter(m => m.type === 'semantic' || m.type === 'procedural');

    const documents = docEntries.map(m => ({
      id: m.id,
      title: m.content.split('\n')[0].slice(0, 80),
      preview: m.content.slice(0, 200),
      type: m.type,
      tags: m.tags,
      agentId: m.agentId,
      relevance: m.relevance,
      weight: m.weight,
      createdAt: m.createdAt,
      modifiedAt: m.updatedAt,
    }));

    return NextResponse.json({
      documents,
      summary: {
        total: documents.length,
        bySemantic: documents.filter(d => d.type === 'semantic').length,
        byProcedural: documents.filter(d => d.type === 'procedural').length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), documents: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, title, content, tags } = await req.json();
    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content required' }, { status: 400 });
    }
    const fullContent = title ? `${title}\n\n${content}` : content;
    const doc = await memory.store(agentId, {
      content: fullContent,
      type: 'semantic',
      tags: tags || [],
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
