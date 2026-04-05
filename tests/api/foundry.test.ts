import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/foundry/patterns/route';

function makeGet(url: string): Request {
  return new Request(url, { method: 'GET' });
}

function makePost(body: unknown): Request {
  return new Request('http://localhost/api/foundry/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/foundry/patterns', () => {
  it('returns all 5 patterns', async () => {
    const res = await GET(makeGet('http://localhost/api/foundry/patterns'));
    const data = await res.json();
    expect(data).toHaveProperty('patterns');
    expect(data.patterns.length).toBe(5);
  });

  it('each pattern has complete crystallization metadata', async () => {
    const res = await GET(makeGet('http://localhost/api/foundry/patterns'));
    const data = await res.json();
    const p = data.patterns[0];
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('name');
    expect(p).toHaveProperty('toolsUsed');
    expect(p).toHaveProperty('exampleGoal');
    expect(p).toHaveProperty('frequency');
    expect(p).toHaveProperty('successRate');
    expect(p).toHaveProperty('averageDuration');
    expect(p).toHaveProperty('proposedCode');
    expect(Array.isArray(p.toolsUsed)).toBe(true);
    expect(typeof p.successRate).toBe('number');
    expect(p.successRate).toBeGreaterThan(0);
    expect(p.successRate).toBeLessThanOrEqual(1);
  });

  it('filters by category', async () => {
    const res = await GET(makeGet('http://localhost/api/foundry/patterns?category=reasoning'));
    const data = await res.json();
    expect(data.patterns.every((p: { category: string }) => p.category === 'reasoning')).toBe(true);
    expect(data.patterns.length).toBeGreaterThan(0);
  });

  it('returns categories list', async () => {
    const res = await GET(makeGet('http://localhost/api/foundry/patterns'));
    const data = await res.json();
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories).toContain('reasoning');
    expect(data.categories).toContain('agentic');
    expect(data.categories).toContain('memory');
  });
});

describe('POST /api/foundry/patterns', () => {
  it('creates a custom pattern', async () => {
    const res = await POST(makePost({
      name: 'My Pattern', description: 'A test pattern', category: 'agentic',
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.pattern.name).toBe('My Pattern');
    expect(data.pattern.id).toMatch(/^pat_custom_/);
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makePost({ description: 'No name' }));
    expect(res.status).toBe(400);
  });
});
