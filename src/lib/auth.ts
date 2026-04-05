/**
 * auth.ts — API authentication helpers for Hermes Command.
 *
 * Strategy: single shared secret stored in MC_API_SECRET env var.
 * - If MC_API_SECRET is not set → dev mode, all requests allowed.
 * - Clients send the secret in the `x-mc-token` header.
 * - The middleware (src/middleware.ts) handles enforcement globally.
 * - This module provides helpers for in-route validation.
 */

const DEV_MODE = !process.env.MC_API_SECRET;

/**
 * Validate a raw token string against the configured secret.
 * Returns true if auth passes (including dev mode with no secret set).
 */
export function isValidToken(token: string | null | undefined): boolean {
  if (DEV_MODE) return true;
  if (!token) return false;
  return token === process.env.MC_API_SECRET;
}

/**
 * Extract the token from a Request, checking header and cookie.
 */
export function extractToken(req: Request): string | null {
  // Header first
  const header = req.headers.get('x-mc-token');
  if (header) return header;

  // Cookie fallback (for browser sessions)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)mc_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Full request auth check. Returns { ok: true } or { ok: false, error }.
 */
export function validateRequest(req: Request): { ok: true } | { ok: false; error: string } {
  if (DEV_MODE) return { ok: true };
  const token = extractToken(req);
  if (!isValidToken(token)) {
    return { ok: false, error: 'Unauthorized: invalid or missing x-mc-token header.' };
  }
  return { ok: true };
}
