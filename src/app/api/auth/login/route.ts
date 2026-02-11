import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { users } from '@/lib/data';
import { verifyPassword } from '@/lib/auth/password';
import { signSessionToken, isJwtConfigured } from '@/lib/auth/jwt';
import { logAuthSuccess, logAuthFailure } from '@/lib/audit';
import type { User } from '@/lib/types';

const AUTH_COOKIE = 'auth-token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

function sanitizeUser(u: User & { passwordHash?: string }): User {
  const { passwordHash: _, ...rest } = u;
  return rest as User;
}

export async function POST(request: Request) {
  if (!isJwtConfigured()) {
    return NextResponse.json(
      { error: 'API login not configured. Set JWT_SECRET (≥32 chars).' },
      { status: 503 }
    );
  }
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  ) as (typeof users)[0] | undefined;
  if (!user) {
    logAuthFailure({ reason: 'Usuario no existe.', code: 'user_not_found', email });
    return NextResponse.json({ error: 'Usuario no existe.' }, { status: 401 });
  }
  if (user.status === 'suspended') {
    logAuthFailure({ reason: 'Cuenta desactivada.', code: 'suspended', email: user.email });
    return NextResponse.json(
      { error: 'Esta cuenta ha sido desactivada.' },
      { status: 403 }
    );
  }
  if (user.status === 'pending_approval') {
    logAuthFailure({ reason: 'Cuenta pendiente de aprobación.', code: 'pending_approval', email: user.email });
    return NextResponse.json(
      { error: 'Esta cuenta está pendiente de aprobación.' },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    logAuthFailure({ reason: 'Contraseña incorrecta.', code: 'wrong_password', email: user.email });
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  const tenantId = user.tenantId ?? process.env.TENANT_ID_DEFAULT ?? '00000000-0000-4000-8000-000000000001';
  logAuthSuccess(tenantId, user.id);
  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId,
  });
  const store = await cookies();
  store.set(AUTH_COOKIE, token, COOKIE_OPTS);

  return NextResponse.json({
    user: sanitizeUser(user),
  });
}
