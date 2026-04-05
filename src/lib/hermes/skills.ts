/**
 * hermes/skills.ts — Skill registry and execution via Hermes API
 */

import { hermesRequest } from './client';
import type {
  HermesSkill,
  SkillRegisterPayload,
  SkillExecutePayload,
  SkillExecuteResult,
  SkillScanResult,
} from './types';

export async function listSkills(): Promise<HermesSkill[]> {
  return hermesRequest<HermesSkill[]>('/skills');
}

export async function getSkill(skillId: string): Promise<HermesSkill> {
  return hermesRequest<HermesSkill>(`/skills/${skillId}`);
}

export async function registerSkill(payload: SkillRegisterPayload): Promise<HermesSkill> {
  return hermesRequest<HermesSkill>('/skills', {
    method: 'POST',
    body: payload,
  });
}

export async function executeSkill(
  skillId: string,
  payload: SkillExecutePayload
): Promise<SkillExecuteResult> {
  return hermesRequest<SkillExecuteResult>(`/skills/${skillId}/execute`, {
    method: 'POST',
    body: payload,
  });
}

export async function toggleSkill(
  agentId: string,
  skillId: string,
  enabled: boolean
): Promise<void> {
  return hermesRequest<void>(`/agents/${agentId}/skills/${skillId}`, {
    method: 'PUT',
    body: { enabled },
  });
}

export async function scanSkill(skillId: string): Promise<SkillScanResult> {
  return hermesRequest<SkillScanResult>(`/skills/${skillId}/scan`, {
    method: 'POST',
  });
}
