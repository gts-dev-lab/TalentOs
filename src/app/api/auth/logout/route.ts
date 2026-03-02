import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth/jwt';
import { logAuthLogout } from '@/lib/audit';

const AUTH_COOKIE = 'auth-token';

function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(s => s.trim());
  for (const part of parts) {
    const [key, ...v] = part.split('=');
    if (key?.toLowerCase() === name.toLowerCase()) return v.join('=').trim() || null;
  }
  return null;
}

export async function POST(request: Request) {
  const token = getCookieFromRequest(request, AUTH_COOKIE);
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.tenantId && payload.sub) {
      logAuthLogout(payload.tenantId, payload.sub);
    }
  }
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
