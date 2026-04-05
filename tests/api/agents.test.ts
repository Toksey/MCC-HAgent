import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/agents/route';
import { POST as CREATE } from '@/app/api/agents/create/route';

function makeRequest(method: string, url = 'http://localhost/api/agents', body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/agents', () => {
  it('returns wrapped { agents: [...] } structure', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty('agents');
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBeGreaterThan(0);
  });

  it('includes health and defaults in response', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty('health');
    expect(data).toHaveProperty('defaults');
    expect(data).toHaveProperty('modelProviders');
  });

  it('each agent has required fields', async () => {
    const res = await GET();
    const data = await res.json();
    const agent = data.agents[0];
    expect(agent).toHaveProperty('id');
    expect(agent).toHaveProperty('name');
    expect(agent).toHaveProperty('model');
    expect(agent).toHaveProperty('status');
  });

  it('agents include workspace and soulPreview', async () => {
    const res = await GET();
    const data = await res.json();
    const agent = data.agents[0];
    expect(agent).toHaveProperty('workspace');
    expect(agent).toHaveProperty('soulPreview');
    expect(agent.workspace).toContain('hermes://');
  });
});

describe('POST /api/agents/create', () => {
  it('creates a new agent — returns { success, agent }', async () => {
    const req = makeRequest('POST', 'http://localhost/api/agents/create', {
      name: 'Nova', role: 'Test Agent', model: 'gpt-4o', provider: 'openai',
    });
    const res = await CREATE(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('agent');
    expect(data.agent).toHaveProperty('id');
    expect(data.agent.name).toBe('Nova');
  });

  it('returns 400 when name is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/agents/create', {
      role: 'Test Agent', model: 'gpt-4o',
    });
    const res = await CREATE(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when role is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/agents/create', {
      name: 'Nova', model: 'gpt-4o',
    });
    const res = await CREATE(req);
    expect(res.status).toBe(400);
  });
});
