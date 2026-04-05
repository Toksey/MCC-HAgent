/**
 * middleware.ts — Next.js edge middleware for API authentication.
 *
 * Protects all /api/* routes with a shared secret (MC_API_SECRET).
 * If the env var is not set, auth is disabled (dev mode).
 *
 * Exempt routes (always public):
 *   GET  /api/settings   — needed to bootstrap the settings UI
 *   POST /api/setup      — needed for first-run onboarding
 *   GET  /api/gateway    — health checks from external tools
 */

import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.MC_API_SECRET;

// Routes that are always accessible without a token
const PUBLIC_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'GET',  path: '/api/settings' },
  { method: 'POST', path: '/api/setup' },
  { method: 'GET',  path: '/api/gateway' },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Dev mode — no secret configured
  if (!SECRET) {
    return NextResponse.next();
  }

  // Check public routes
  const isPublic = PUBLIC_ROUTES.some(
    (r) => req.method === r.method && pathname === r.path
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Validate token from header or cookie
  const headerToken = req.headers.get('x-mc-token');
  const cookieToken = req.cookies.get('mc_token')?.value ?? null;
  const token = headerToken ?? cookieToken;

  if (token !== SECRET) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        hint: 'Set MC_API_SECRET in .env.local and pass x-mc-token header or mc_token cookie.',
      },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
