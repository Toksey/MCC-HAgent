/**
 * hermes/client.ts — Base HTTP client for the Hermes Agent API
 *
 * Provides typed fetch wrapper with auth, retries, and error handling.
 * Falls back to mock provider when HERMES_API_URL is not set.
 */

import type { HermesApiError } from './types';

// ── Configuration ──────────────────────────────────────────────

const HERMES_API_URL = process.env.HERMES_API_URL || '';
const HERMES_API_KEY = process.env.HERMES_API_KEY || '';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

// ── Error Class ────────────────────────────────────────────────

export class HermesClientError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(error: HermesApiError) {
    super(error.message);
    this.name = 'HermesClientError';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.details = error.details;
  }
}

// ── Helper Utilities ───────────────────────────────────────────

function isApiConfigured(): boolean {
  return HERMES_API_URL.length > 0;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (HERMES_API_KEY) {
    headers['Authorization'] = `Bearer ${HERMES_API_KEY}`;
  }

  return headers;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Core Request Function ──────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  retries?: number;
}

export async function hermesRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, retries = MAX_RETRIES } = options;

  // Build URL with query params
  const url = new URL(path, HERMES_API_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: getHeaders(),
    cache: 'no-store' as RequestCache,
  };

  if (body !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Retry loop with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development' && attempt > 0) {
        console.log(`[hermes] Retry ${attempt}/${retries} for ${method} ${path}`);
      }

      const response = await fetch(url.toString(), fetchOptions);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new HermesClientError({
          code: errorBody.code || `HTTP_${response.status}`,
          message: errorBody.message || response.statusText,
          statusCode: response.status,
          details: errorBody.details,
        });
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (error instanceof HermesClientError && error.statusCode < 500) {
        throw error;
      }

      // Exponential backoff
      if (attempt < retries - 1) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// ── Export the config check ────────────────────────────────────

export { isApiConfigured };
