/**
 * TT-102: Middleware de contexto de inquilino.
 * Para rutas /api/* protegidas: exige JWT válido con tenant_id.
 * Rechaza con 401 las peticiones sin token o sin tenant_id en el payload.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, isJwtConfigured } from '@/lib/auth/jwt';

const AUTH_COOKIE = 'auth-token';

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/session',
  '/api/auth/logout',
  '/api/nextauth',
  '/api/lti', // TT-105: LTI 1.3 OIDC login initiation y callback (sin cookie propia)
];

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (!isJwtConfigured()) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid auth token' },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!payload.tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Tenant context required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
