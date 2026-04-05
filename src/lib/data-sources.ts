import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { LogEntry } from './types';

/**
 * Read and parse a JSON file. Returns null if file doesn't exist.
 */
export async function readJson<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read a JSONL file and parse each line as JSON.
 */
export async function readJsonl<T = unknown>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return raw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

/**
 * Read a markdown file as text. Returns empty string if not found.
 */
export async function readMarkdown(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Write to a JSON file.
 */
export async function writeJson(filePath: string, data: any): Promise<boolean> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Write to a markdown file.
 */
export async function writeMarkdown(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * List directory entries with stats.
 */
export async function readDirectory(dirPath: string): Promise<
  Array<{
    name: string;
    path: string;
    isDirectory: boolean;
    sizeBytes: number;
    modifiedAt: string;
  }>
> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results = await Promise.all(
      entries
        .filter((e) => !e.name.startsWith('.'))
        .map(async (entry) => {
          const fullPath = join(dirPath, entry.name);
          try {
            const stat = await fs.stat(fullPath);
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              sizeBytes: stat.size,
              modifiedAt: stat.mtime.toISOString(),
            };
          } catch {
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              sizeBytes: 0,
              modifiedAt: new Date().toISOString(),
            };
          }
        })
    );
    return results;
  } catch {
    return [];
  }
}

/**
 * Read the last N lines of a log file.
 */
export async function readLogTail(filePath: string, lines = 50): Promise<string[]> {
  try {
    const stat = await fs.stat(filePath);
    const chunkSize = Math.min(stat.size, lines * 500); // estimate ~500 bytes/line
    const buffer = Buffer.alloc(chunkSize);
    const fh = await fs.open(filePath, 'r');
    await fh.read(buffer, 0, chunkSize, stat.size - chunkSize);
    await fh.close();
    const text = buffer.toString('utf-8');
    const allLines = text.split('\n').filter((l) => l.trim().length > 0);
    return allLines.slice(-lines);
  } catch {
    return [];
  }
}

/**
 * Parse raw log lines into structured LogEntry objects.
 */
export function parseLogLines(rawLines: string[]): LogEntry[] {
  return rawLines.map((raw) => {
    // Format: 2026-03-12T00:28:51.355+01:00 [component] [sub] message
    const match = raw.match(
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*[+-]\d{2}:\d{2})\s+(.*)$/
    );

    if (match) {
      const timestamp = match[1];
      const rest = match[2];

      // Extract bracketed source tags
      const sourceMatch = rest.match(/^((?:\[[^\]]*\]\s*)+)(.*)$/);
      const source = sourceMatch
        ? sourceMatch[1].replace(/[\[\]]/g, '').trim()
        : undefined;
      const message = sourceMatch ? sourceMatch[2].trim() : rest.trim();

      // Determine level from content
      const lowerMsg = (message + ' ' + (source || '')).toLowerCase();
      let level: LogEntry['level'] = 'info';
      if (lowerMsg.includes('error') || lowerMsg.includes('fail') || lowerMsg.includes('restarting')) {
        level = 'warning';
      }
      if (lowerMsg.includes('fatal') || lowerMsg.includes('crash')) {
        level = 'error';
      }

      return { timestamp, level, message, source, raw };
    }

    // Fallback for non-matching lines
    const lowerRaw = raw.toLowerCase();
    let level: LogEntry['level'] = 'info';
    if (lowerRaw.includes('error') || lowerRaw.includes('fail')) level = 'error';
    else if (lowerRaw.includes('warn')) level = 'warning';

    return {
      timestamp: new Date().toISOString(),
      level,
      message: raw.trim(),
      raw,
    };
  });
}

/**
 * Count files in a directory matching optional extension filter.
 */
export async function countFiles(dirPath: string, extensions?: string[]): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath);
    if (!extensions) return entries.length;
    return entries.filter((name) => {
      const ext = extname(name).toLowerCase();
      return extensions.includes(ext);
    }).length;
  } catch {
    return 0;
  }
}

/**
 * Check if a file was modified today.
 */
export async function wasModifiedToday(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    const today = new Date().toISOString().split('T')[0];
    const modified = stat.mtime.toISOString().split('T')[0];
    return today === modified;
  } catch {
    return false;
  }
}

/**
 * Check if a file/directory exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
