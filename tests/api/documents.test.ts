import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/documents/generate/route';

function makePost(body: unknown): Request {
  return new Request('http://localhost/api/documents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const AGENT = {
  name: 'Apex', role: 'Lead Engineer', model: 'gpt-4o',
  provider: 'openai', autonomyLevel: 'autonomous', skills: ['coding'],
};

describe('POST /api/documents/generate', () => {
  it('returns 400 when target is missing', async () => {
    const res = await POST(makePost({ prompt: 'Test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when prompt is missing', async () => {
    const res = await POST(makePost({ target: 'SOUL.MD' }));
    expect(res.status).toBe(400);
  });

  it('generates SOUL.md with agent identity content', async () => {
    const res = await POST(makePost({
      target: 'SOUL.md', prompt: 'Be excellent and transparent', agentContext: AGENT,
    }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.content).toContain('Apex');
    expect(data.content).toContain('SOUL');
    expect(typeof data.wordCount).toBe('number');
    expect(data.wordCount).toBeGreaterThan(50);
    expect(data.generatedAt).toBeTruthy();
  });

  it('generates RULES.md with autonomy-specific content', async () => {
    const res = await POST(makePost({
      target: 'RULES.MD', prompt: 'Follow strict security protocols', agentContext: AGENT,
    }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.content).toContain('RULES');
    expect(data.content).toContain('autonomous');
  });

  it('generates PERSONA.md', async () => {
    const res = await POST(makePost({
      target: 'PERSONA', prompt: 'Expert communicator', agentContext: AGENT,
    }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.content).toContain('PERSONA');
    expect(data.content).toContain('Apex');
  });

  it('generates IDENTITY.md', async () => {
    const res = await POST(makePost({
      target: 'IDENTITY', prompt: 'Senior engineer identity', agentContext: AGENT,
    }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.content).toContain('IDENTITY');
  });

  it('generates generic document for unknown target', async () => {
    const res = await POST(makePost({
      target: 'CUSTOM.md', prompt: 'Some custom content', agentContext: AGENT,
    }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.wordCount).toBeGreaterThan(0);
  });
});
