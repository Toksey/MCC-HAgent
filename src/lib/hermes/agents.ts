/**
 * hermes/agents.ts — Agent CRUD operations via Hermes API
 */

import { hermesRequest } from './client';
import type {
  HermesAgent,
  AgentCreatePayload,
  AgentUpdatePayload,
  AgentPolicy,
} from './types';

export async function getAgents(): Promise<HermesAgent[]> {
  return hermesRequest<HermesAgent[]>('/agents');
}

export async function getAgent(id: string): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>(`/agents/${id}`);
}

export async function createAgent(payload: AgentCreatePayload): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>('/agents', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAgent(id: string, payload: AgentUpdatePayload): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>(`/agents/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAgent(id: string): Promise<void> {
  return hermesRequest<void>(`/agents/${id}`, {
    method: 'DELETE',
  });
}

// ── Agent Policies ─────────────────────────────────────────────

export async function getAgentPolicy(agentId: string): Promise<AgentPolicy> {
  return hermesRequest<AgentPolicy>(`/agents/${agentId}/policy`);
}

export async function updateAgentPolicy(
  agentId: string,
  policy: Partial<AgentPolicy>
): Promise<AgentPolicy> {
  return hermesRequest<AgentPolicy>(`/agents/${agentId}/policy`, {
    method: 'PUT',
    body: policy,
  });
}

// ── Loop Control ───────────────────────────────────────────────

export async function pauseAgent(agentId: string): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>(`/agents/${agentId}/loop/pause`, {
    method: 'POST',
  });
}

export async function resumeAgent(agentId: string): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>(`/agents/${agentId}/loop/resume`, {
    method: 'POST',
  });
}

export async function stepAgent(agentId: string): Promise<HermesAgent> {
  return hermesRequest<HermesAgent>(`/agents/${agentId}/loop/step`, {
    method: 'POST',
  });
}

// ── Operations ─────────────────────────────────────────────────

export async function generateDocument(
  agentId: string,
  payload: { target: string; prompt: string }
): Promise<{ content: string }> {
  return hermesRequest<{ content: string }>(`/agents/${agentId}/generate`, {
    method: 'POST',
    body: payload,
  });
}
