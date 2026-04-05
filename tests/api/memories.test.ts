import { describe, it, expect } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/memories/route';

function makeGet(url: string): Request {
  return new Request(url, { method: 'GET' });
}

function makePost(body: unknown): Request {
  return new Request('http://localhost/api/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDelete(url: string): Request {
  return new Request(url, { method: 'DELETE' });
}

describe('GET /api/memories', () => {
  it('returns all memories when no params given', async () => {
    const res = await GET(makeGet('http://localhost/api/memories'));
    const data = await res.json();
    expect(data).toHaveProperty('memories');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.memories)).toBe(true);
    expect(data.memories.length).toBeGreaterThan(0);
  });

  it('filters by agentId', async () => {
    const res = await GET(makeGet('http://localhost/api/memories?agentId=agent_apex'));
    const data = await res.json();
    const allApex = data.memories.every((m: { agentId: string }) => m.agentId === 'agent_apex');
    expect(allApex).toBe(true);
  });

  it('summary contains byType breakdown', async () => {
    const res = await GET(makeGet('http://localhost/api/memories'));
    const data = await res.json();
    expect(data.summary).toHaveProperty('total');
    expect(data.summary).toHaveProperty('byType');
    expect(data.summary.byType).toHaveProperty('episodic');
    expect(data.summary.byType).toHaveProperty('semantic');
  });
});

describe('POST /api/memories', () => {
  it('creates a memory entry with required fields', async () => {
    const res = await POST(makePost({ agentId: 'agent_apex', content: 'Test memory', type: 'episodic' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.content).toBe('Test memory');
  });

  it('returns 400 when agentId is missing', async () => {
    const res = await POST(makePost({ content: 'No agent' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(makePost({ agentId: 'agent_apex' }));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/memories', () => {
  it('returns 400 when id param is missing', async () => {
    const res = await DELETE(makeDelete('http://localhost/api/memories'));
    expect(res.status).toBe(400);
  });
});
