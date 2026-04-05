/**
 * Convert a cron expression to human-readable text.
 */
export function cronToHuman(expr: string, tz?: string): string {
  const parts = expr.split(' ');
  if (parts.length < 5) return expr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const tzLabel = tz ? ` (${tz.split('/').pop()})` : '';

  // Every X minutes
  if (minute.startsWith('*/') && hour === '*') {
    return `Every ${minute.slice(2)} min${tzLabel}`;
  }

  // Every X hours
  if (hour.startsWith('*/') && minute === '0') {
    return `Every ${hour.slice(2)} hours${tzLabel}`;
  }

  // Specific time daily
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${formatTime(hour, minute)}${tzLabel}`;
  }

  // Specific weekdays
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = dayOfWeek.split(',').map(parseDayName).join(', ');
    if (dayOfWeek === '1-5') {
      return `Weekdays at ${formatTime(hour, minute)}${tzLabel}`;
    }
    return `${days} at ${formatTime(hour, minute)}${tzLabel}`;
  }

  return `${expr}${tzLabel}`;
}

function formatTime(hour: string, minute: string): string {
  const h = parseInt(hour);
  const m = parseInt(minute);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function parseDayName(day: string): string {
  const names: Record<string, string> = {
    '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed',
    '4': 'Thu', '5': 'Fri', '6': 'Sat',
  };
  return names[day] || day;
}

/**
 * Convert a schedule object to human-readable text.
 */
export function scheduleToHuman(schedule: {
  kind: string;
  expr?: string;
  tz?: string;
  everyMs?: number;
  at?: string;
}): string {
  switch (schedule.kind) {
    case 'cron':
      return schedule.expr ? cronToHuman(schedule.expr, schedule.tz) : 'Cron';
    case 'every': {
      if (!schedule.everyMs) return 'Interval';
      const mins = schedule.everyMs / 60000;
      if (mins < 60) return `Every ${mins}m`;
      const hours = mins / 60;
      return `Every ${hours}h`;
    }
    case 'at':
      if (!schedule.at) return 'Scheduled';
      return `At ${new Date(schedule.at).toLocaleDateString()}`;
    default:
      return schedule.kind;
  }
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { data: Record<string, string>, content: string }
 */
export function parseYamlFrontmatter(
  markdown: string
): { data: Record<string, string>; content: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: markdown };

  const yamlBlock = match[1];
  const content = match[2];
  const data: Record<string, string> = {};

  yamlBlock.split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      data[key] = value;
    }
  });

  return { data, content };
}

/**
 * Relative time from a timestamp (e.g. "2m ago", "3h ago")
 */
export function relativeTime(timestamp: number | string): string {
  const now = Date.now();
  const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;

  if (isNaN(ts)) return 'just now';

  const diffMs = now - ts;

  if (diffMs < 0) {
    // Future time
    const absDiff = Math.abs(diffMs);
    if (absDiff < 60000) return `in ${Math.floor(absDiff / 1000)}s`;
    if (absDiff < 3600000) return `in ${Math.floor(absDiff / 60000)}m`;
    if (absDiff < 86400000) return `in ${Math.floor(absDiff / 3600000)}h`;
    return `in ${Math.floor(absDiff / 86400000)}d`;
  }

  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return `${Math.floor(diffMs / 86400000)}d ago`;
}

/**
 * Truncate text to maxLen with ellipsis.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}
