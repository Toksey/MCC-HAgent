/**
 * hermes/index.ts — Unified Hermes adapter barrel export
 *
 * Runtime switcher: uses mock provider when HERMES_API_URL is absent,
 * real API client when configured.
 */

import { isApiConfigured } from './client';
import * as agentsApi from './agents';
import * as memoryApi from './memory';
import * as skillsApi from './skills';
import * as goalsApi from './goals';
import * as telemetryApi from './telemetry';
import * as mcpApi from './mcp';
import {
  mockAgents,
  mockMemory,
  mockSkills,
  mockGoals,
  mockTelemetry,
  mockMCP,
} from './mock-provider';

// ── Runtime adapter selection ──────────────────────────────────

export function isMockMode(): boolean {
  return !isApiConfigured();
}

// ── Agents ─────────────────────────────────────────────────────

export const agents = {
  getAgents: () => isMockMode() ? mockAgents.getAgents() : agentsApi.getAgents(),
  getAgent: (id: string) => isMockMode() ? mockAgents.getAgent(id) : agentsApi.getAgent(id),
  createAgent: (p: Parameters<typeof agentsApi.createAgent>[0]) => isMockMode() ? mockAgents.createAgent(p) : agentsApi.createAgent(p),
  updateAgent: (id: string, p: Parameters<typeof agentsApi.updateAgent>[1]) => isMockMode() ? mockAgents.updateAgent(id, p) : agentsApi.updateAgent(id, p),
  deleteAgent: (id: string) => isMockMode() ? mockAgents.deleteAgent(id) : agentsApi.deleteAgent(id),
  getPolicy: (id: string) => isMockMode() ? mockAgents.getAgentPolicy(id) : agentsApi.getAgentPolicy(id),
  updatePolicy: (id: string, p: Parameters<typeof agentsApi.updateAgentPolicy>[1]) => isMockMode() ? mockAgents.updateAgentPolicy(id, p) : agentsApi.updateAgentPolicy(id, p),
  pause: (id: string) => isMockMode() ? mockAgents.pauseAgent(id) : agentsApi.pauseAgent(id),
  resume: (id: string) => isMockMode() ? mockAgents.resumeAgent(id) : agentsApi.resumeAgent(id),
  step: (id: string) => isMockMode() ? mockAgents.stepAgent(id) : agentsApi.stepAgent(id),
  generateDocument: (id: string, p: Parameters<typeof agentsApi.generateDocument>[1]) => isMockMode() ? mockAgents.generateDocument(id, p) : agentsApi.generateDocument(id, p),
};

// ── Memory ─────────────────────────────────────────────────────

export const memory = {
  getMemories: (agentId: string) => isMockMode() ? mockMemory.getMemories(agentId) : memoryApi.getMemories(agentId),
  store: (agentId: string, p: Parameters<typeof memoryApi.storeMemory>[1]) => isMockMode() ? mockMemory.storeMemory(agentId, p) : memoryApi.storeMemory(agentId, p),
  query: (agentId: string, p: Parameters<typeof memoryApi.queryMemory>[1]) => isMockMode() ? mockMemory.queryMemory(agentId, p) : memoryApi.queryMemory(agentId, p),
  get: (memId: string) => isMockMode() ? mockMemory.getMemory(memId) : memoryApi.getMemory(memId),
  update: (memId: string, u: Parameters<typeof memoryApi.updateMemory>[1]) => isMockMode() ? mockMemory.updateMemory(memId, u) : memoryApi.updateMemory(memId, u),
  delete: (memId: string) => isMockMode() ? mockMemory.deleteMemory(memId) : memoryApi.deleteMemory(memId),
  reinforce: (memId: string) => isMockMode() ? mockMemory.reinforceMemory(memId) : memoryApi.reinforceMemory(memId),
  reflect: (agentId: string) => isMockMode() ? mockMemory.reflectMemory(agentId) : memoryApi.reflectMemory(agentId),
  getAll: () => isMockMode() ? mockMemory.getAllMemories() : memoryApi.getMemories('__all__'),
};

// ── Skills ─────────────────────────────────────────────────────

export const skills = {
  list: () => isMockMode() ? mockSkills.listSkills() : skillsApi.listSkills(),
  get: (id: string) => isMockMode() ? mockSkills.getSkill(id) : skillsApi.getSkill(id),
  register: (p: Parameters<typeof skillsApi.registerSkill>[0]) => isMockMode() ? mockSkills.registerSkill(p) : skillsApi.registerSkill(p),
  execute: (id: string, p: Parameters<typeof skillsApi.executeSkill>[1]) => isMockMode() ? mockSkills.executeSkill(id, p) : skillsApi.executeSkill(id, p),
  toggle: (agentId: string, skillId: string, enabled: boolean) => isMockMode() ? mockSkills.toggleSkill(agentId, skillId, enabled) : skillsApi.toggleSkill(agentId, skillId, enabled),
  scan: (id: string) => isMockMode() ? mockSkills.scanSkill(id) : skillsApi.scanSkill(id),
};

// ── Goals ──────────────────────────────────────────────────────

export const goals = {
  getForAgent: (agentId: string) => isMockMode() ? mockGoals.getGoals(agentId) : goalsApi.getGoals(agentId),
  get: (id: string) => isMockMode() ? mockGoals.getGoal(id) : goalsApi.getGoal(id),
  create: (agentId: string, p: Parameters<typeof goalsApi.createGoal>[1]) => isMockMode() ? mockGoals.createGoal(agentId, p) : goalsApi.createGoal(agentId, p),
  update: (id: string, u: Parameters<typeof goalsApi.updateGoal>[1]) => isMockMode() ? mockGoals.updateGoal(id, u) : goalsApi.updateGoal(id, u),
  delete: (id: string) => isMockMode() ? mockGoals.deleteGoal(id) : goalsApi.deleteGoal(id),
  decompose: (id: string) => isMockMode() ? mockGoals.decomposeGoal(id) : goalsApi.decomposeGoal(id),
  getAll: () => isMockMode() ? mockGoals.getAllGoals() : goalsApi.getAllGoals(),
};

// ── Telemetry ──────────────────────────────────────────────────

export const telemetry = {
  getState: (agentId: string) => isMockMode() ? mockTelemetry.getAgentState(agentId) : telemetryApi.getAgentState(agentId),
  getLogs: (agentId: string, limit?: number) => isMockMode() ? mockTelemetry.getAgentLogs(agentId, limit) : telemetryApi.getAgentLogs(agentId, limit),
  getActions: (agentId: string, limit?: number) => isMockMode() ? mockTelemetry.getAgentActions(agentId, limit) : telemetryApi.getAgentActions(agentId, limit),
  getThoughts: (agentId: string, limit?: number) => isMockMode() ? mockTelemetry.getAgentThoughts(agentId, limit) : telemetryApi.getAgentThoughts(agentId, limit),
  getLoopStatus: (agentId: string) => isMockMode() ? mockTelemetry.getLoopStatus(agentId) : telemetryApi.getLoopStatus(agentId),
  getSystemHealth: () => isMockMode() ? mockTelemetry.getSystemHealth() : telemetryApi.getSystemHealth(),
};

// ── MCP ────────────────────────────────────────────────────────

export const mcp = {
  listTools: () => isMockMode() ? mockMCP.listTools() : mcpApi.listTools(),
  getTool: (id: string) => isMockMode() ? mockMCP.getTool(id) : mcpApi.getTool(id),
  registerTool: (t: Parameters<typeof mcpApi.registerTool>[0]) => isMockMode() ? mockMCP.registerTool(t) : mcpApi.registerTool(t),
  executeTool: (id: string, p: Parameters<typeof mcpApi.executeTool>[1]) => isMockMode() ? mockMCP.executeTool(id, p) : mcpApi.executeTool(id, p),
  injectContext: (agentId: string, ctx: Record<string, unknown>) => isMockMode() ? mockMCP.injectContext(agentId, ctx) : mcpApi.injectContext(agentId, ctx),
  getPermissions: (agentId: string) => isMockMode() ? mockMCP.getToolPermissions(agentId) : mcpApi.getToolPermissions(agentId),
  setPermission: (agentId: string, toolId: string, enabled: boolean) => isMockMode() ? mockMCP.setToolPermission(agentId, toolId, enabled) : mcpApi.setToolPermission(agentId, toolId, enabled),
};

// ── Re-exports ─────────────────────────────────────────────────

export * from './types';
export { isApiConfigured } from './client';
export { HermesClientError } from './client';
