import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/budget/route';

function makeRequest(url = 'http://localhost/api/budget'): Request {
  return new Request(url, { method: 'GET' });
}

describe('GET /api/budget', () => {
  it('returns budget state with required fields', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty('budget');
    expect(data).toHaveProperty('utilization');
    expect(data).toHaveProperty('topSpenders');
    expect(data).toHaveProperty('alertTriggered');
    expect(data).toHaveProperty('overCap');
    expect(data).toHaveProperty('systemStats');
  });

  it('utilization is a number 0-100', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.utilization).toBeGreaterThanOrEqual(0);
    expect(data.utilization).toBeLessThanOrEqual(100);
  });

  it('topSpenders is a non-empty array', async () => {
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data.topSpenders)).toBe(true);
    expect(data.topSpenders.length).toBeGreaterThan(0);
    expect(data.topSpenders[0]).toHaveProperty('agentId');
    expect(data.topSpenders[0]).toHaveProperty('spend');
  });

  it('budget has hardCapUsd and softCapUsd', async () => {
    const res = await GET();
    const data = await res.json();
    expect(typeof data.budget.hardCapUsd).toBe('number');
    expect(typeof data.budget.softCapUsd).toBe('number');
    expect(data.budget.hardCapUsd).toBeGreaterThan(0);
    expect(data.budget.softCapUsd).toBeGreaterThan(0);
  });

  it('systemStats includes totalSkillExecutions and averageLoopLatencyMs', async () => {
    const res = await GET();
    const data = await res.json();
    expect(typeof data.systemStats.totalSkillExecutions).toBe('number');
    expect(typeof data.systemStats.averageLoopLatencyMs).toBe('number');
  });
});
