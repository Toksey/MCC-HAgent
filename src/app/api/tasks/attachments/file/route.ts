/**
 * /api/tasks/attachments/file — File download stub
 * Replaces: fs.readFile(openclaw-paths) → Hermes file reference
 */
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  return NextResponse.json({
    error: 'File attachments are managed via the Hermes API when connected.',
    mode: 'mock',
  }, { status: 501 });
}
