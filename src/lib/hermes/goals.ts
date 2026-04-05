/**
 * hermes/goals.ts — Goal management and decomposition via Hermes API
 */

import { hermesRequest } from './client';
import type {
  Goal,
  GoalCreatePayload,
  GoalDecomposition,
} from './types';

export async function getGoals(agentId: string): Promise<Goal[]> {
  return hermesRequest<Goal[]>(`/agents/${agentId}/goals`);
}

export async function getGoal(goalId: string): Promise<Goal> {
  return hermesRequest<Goal>(`/goals/${goalId}`);
}

export async function createGoal(
  agentId: string,
  payload: GoalCreatePayload
): Promise<Goal> {
  return hermesRequest<Goal>(`/agents/${agentId}/goals`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Goal>
): Promise<Goal> {
  return hermesRequest<Goal>(`/goals/${goalId}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  return hermesRequest<void>(`/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export async function decomposeGoal(goalId: string): Promise<GoalDecomposition> {
  return hermesRequest<GoalDecomposition>(`/goals/${goalId}/decompose`, {
    method: 'POST',
  });
}

// ── Task-style helpers (backward compat with Kanban board) ─────

export async function getAllGoals(): Promise<Goal[]> {
  return hermesRequest<Goal[]>('/goals');
}

export async function updateGoalStatus(
  goalId: string,
  status: Goal['status']
): Promise<Goal> {
  return updateGoal(goalId, { status });
}
