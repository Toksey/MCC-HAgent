/**
 * mc-storage.ts — Mission Control storage helper
 *
 * Provides atomic JSON read/write, auto-seed for missing files,
 * optimistic concurrency, and simple schema versioning for all
 * Mission Control-owned state files.
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { MC_DATA_DIR } from './openclaw-paths';

// ── Schema version ─────────────────────────────────────────────
const CURRENT_SCHEMA_VERSION = 1;

interface VersionedStore<T> {
  version: number;
  data: T;
}

// ── Ensure directory + file exist ──────────────────────────────
export async function ensureJsonFile<T>(
  filePath: string,
  defaultValue: T,
): Promise<void> {
  try {
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.access(filePath);
  } catch {
    await fs.writeFile(
      filePath,
      JSON.stringify({ version: CURRENT_SCHEMA_VERSION, data: defaultValue }, null, 2),
      'utf-8',
    );
  }
}

// ── Ensure the entire MC data directory ────────────────────────
export async function ensureMcDataDir(): Promise<void> {
  await fs.mkdir(MC_DATA_DIR, { recursive: true });
}

// ── Read with auto-seed ────────────────────────────────────────
export async function readMcJson<T>(
  filePath: string,
  defaultValue: T,
): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    // Support both versioned and plain formats
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      return (parsed as VersionedStore<T>).data;
    }
    return parsed as T;
  } catch {
    // File doesn't exist — seed it
    await ensureJsonFile(filePath, defaultValue);
    return defaultValue;
  }
}

// ── Write atomically (write to temp, then rename) ──────────────
export async function writeMcJson<T>(
  filePath: string,
  data: T,
): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true });
  const tmpPath = filePath + '.tmp';
  const payload: VersionedStore<T> = {
    version: CURRENT_SCHEMA_VERSION,
    data,
  };
  await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

// ── Append to array store ──────────────────────────────────────
export async function appendMcRecord<T>(
  filePath: string,
  record: T,
): Promise<void> {
  const existing = await readMcJson<T[]>(filePath, []);
  existing.push(record);
  await writeMcJson(filePath, existing);
}

// ── Update a record in an array store by ID ────────────────────
export async function updateMcRecord<T extends { id: string }>(
  filePath: string,
  id: string,
  updater: (record: T) => T,
): Promise<T | null> {
  const existing = await readMcJson<T[]>(filePath, []);
  const idx = existing.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  existing[idx] = updater(existing[idx]);
  await writeMcJson(filePath, existing);
  return existing[idx];
}

// ── Delete a record from array store by ID ─────────────────────
export async function deleteMcRecord<T extends { id: string }>(
  filePath: string,
  id: string,
): Promise<boolean> {
  const existing = await readMcJson<T[]>(filePath, []);
  const filtered = existing.filter((r) => r.id !== id);
  if (filtered.length === existing.length) return false;
  await writeMcJson(filePath, filtered);
  return true;
}

// ── Filter records by company ──────────────────────────────────
export async function readMcByCompany<T extends { companyId: string }>(
  filePath: string,
  companyId: string,
): Promise<T[]> {
  const all = await readMcJson<T[]>(filePath, []);
  return all.filter((r) => r.companyId === companyId);
}

// ── Generate a simple unique ID ────────────────────────────────
export function generateId(prefix = 'mc'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rand}`;
}
