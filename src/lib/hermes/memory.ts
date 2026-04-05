/**
 * hermes/memory.ts — OpenBrain memory operations via Hermes API
 */

import { hermesRequest } from './client';
import type {
  MemoryEntry,
  MemoryStorePayload,
  MemoryQueryPayload,
  MemoryReflection,
} from './types';

export async function getMemories(agentId: string): Promise<MemoryEntry[]> {
  return hermesRequest<MemoryEntry[]>(`/agents/${agentId}/memory`);
}

export async function storeMemory(
  agentId: string,
  payload: MemoryStorePayload
): Promise<MemoryEntry> {
  return hermesRequest<MemoryEntry>(`/agents/${agentId}/memory`, {
    method: 'POST',
    body: payload,
  });
}

export async function queryMemory(
  agentId: string,
  payload: MemoryQueryPayload
): Promise<MemoryEntry[]> {
  return hermesRequest<MemoryEntry[]>(`/agents/${agentId}/memory/query`, {
    method: 'POST',
    body: payload,
  });
}

export async function getMemory(memoryId: string): Promise<MemoryEntry> {
  return hermesRequest<MemoryEntry>(`/memory/${memoryId}`);
}

export async function updateMemory(
  memoryId: string,
  updates: Partial<MemoryEntry>
): Promise<MemoryEntry> {
  return hermesRequest<MemoryEntry>(`/memory/${memoryId}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function deleteMemory(memoryId: string): Promise<void> {
  return hermesRequest<void>(`/memory/${memoryId}`, {
    method: 'DELETE',
  });
}

export async function reinforceMemory(memoryId: string): Promise<MemoryEntry> {
  return hermesRequest<MemoryEntry>(`/memory/${memoryId}/reinforce`, {
    method: 'POST',
  });
}

export async function reflectMemory(agentId: string): Promise<MemoryReflection> {
  return hermesRequest<MemoryReflection>(`/agents/${agentId}/memory/reflect`, {
    method: 'POST',
  });
}
