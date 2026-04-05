/**
 * hermes/mcp.ts — Model Context Protocol integration layer
 */

import { hermesRequest } from './client';
import type {
  MCPTool,
  MCPToolExecutePayload,
  MCPToolExecuteResult,
  MCPContext,
} from './types';

export async function listTools(): Promise<MCPTool[]> {
  return hermesRequest<MCPTool[]>('/mcp/tools');
}

export async function getTool(toolId: string): Promise<MCPTool> {
  return hermesRequest<MCPTool>(`/mcp/tools/${toolId}`);
}

export async function registerTool(tool: Omit<MCPTool, 'id'>): Promise<MCPTool> {
  return hermesRequest<MCPTool>('/mcp/tools', {
    method: 'POST',
    body: tool,
  });
}

export async function executeTool(
  toolId: string,
  payload: MCPToolExecutePayload
): Promise<MCPToolExecuteResult> {
  return hermesRequest<MCPToolExecuteResult>(`/mcp/tools/${toolId}/execute`, {
    method: 'POST',
    body: payload,
  });
}

export async function injectContext(
  agentId: string,
  context: Record<string, unknown>
): Promise<MCPContext> {
  return hermesRequest<MCPContext>(`/agents/${agentId}/mcp/context`, {
    method: 'POST',
    body: { context },
  });
}

export async function getToolPermissions(
  agentId: string
): Promise<{ toolId: string; enabled: boolean }[]> {
  return hermesRequest(`/agents/${agentId}/mcp/permissions`);
}

export async function setToolPermission(
  agentId: string,
  toolId: string,
  enabled: boolean
): Promise<void> {
  return hermesRequest<void>(`/agents/${agentId}/mcp/permissions/${toolId}`, {
    method: 'PUT',
    body: { enabled },
  });
}
