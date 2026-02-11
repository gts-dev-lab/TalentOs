import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { users } from '@/lib/data';
import { verifySessionToken, isJwtConfigured } from '@/lib/auth/jwt';
import type { User } from '@/lib/types';

const AUTH_COOKIE = 'auth-token';

function sanitizeUser(u: User & { passwordHash?: string }): User {
  const { passwordHash: _, ...rest } = u;
  return rest as User;
}

export async function GET() {
  if (!isJwtConfigured()) {
    return NextResponse.json(
      { error: 'API auth not configured.' },
      { status: 503 }
    );
  }
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.tenantId) {
    return NextResponse.json({ user: null });
  }

  const user = users.find((u) => u.id === payload.sub) as (typeof users)[0] | undefined;
  if (!user) {
    return NextResponse.json({ user: null });
  }
  if (user.status === 'suspended' || user.status === 'pending_approval') {
    return NextResponse.json({ error: 'Account not active.' }, { status: 403 });
  }

  return NextResponse.json({
    user: sanitizeUser(user),
  });
}
