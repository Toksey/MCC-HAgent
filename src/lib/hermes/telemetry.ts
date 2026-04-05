/**
 * hermes/telemetry.ts — Agent telemetry and cognitive state monitoring
 */

import { hermesRequest } from './client';
import type {
  TelemetryState,
  CognitiveAction,
  SystemHealth,
} from './types';

export async function getAgentState(agentId: string): Promise<TelemetryState> {
  return hermesRequest<TelemetryState>(`/agents/${agentId}/telemetry`);
}

export async function getAgentLogs(
  agentId: string,
  limit = 50
): Promise<CognitiveAction[]> {
  return hermesRequest<CognitiveAction[]>(`/agents/${agentId}/logs`, {
    params: { limit },
  });
}

export async function getAgentActions(
  agentId: string,
  limit = 20
): Promise<CognitiveAction[]> {
  return hermesRequest<CognitiveAction[]>(`/agents/${agentId}/actions`, {
    params: { limit },
  });
}

export async function getAgentThoughts(
  agentId: string,
  limit = 20
): Promise<CognitiveAction[]> {
  return hermesRequest<CognitiveAction[]>(`/agents/${agentId}/thoughts`, {
    params: { limit, type: 'think' },
  });
}

export async function getLoopStatus(agentId: string): Promise<{
  phase: TelemetryState['loopPhase'];
  latencyMs: number;
  lastAction?: CognitiveAction;
  nextPredicted?: string;
}> {
  return hermesRequest(`/agents/${agentId}/loop/status`);
}

export async function getSystemHealth(): Promise<SystemHealth> {
  return hermesRequest<SystemHealth>('/telemetry/health');
}
