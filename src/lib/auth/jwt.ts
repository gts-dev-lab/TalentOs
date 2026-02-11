import * as jose from 'jose';

const JWT_ALG = 'HS256';
const JWT_EXP = '7d';
const JWT_ISSUER = 'talentos';

export type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  /** UUID v4 del inquilino (obligatorio para multi-tenant; TT-102) */
  tenantId: string;
  iat?: number;
  exp?: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
  })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXP)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      algorithms: [JWT_ALG],
    });
    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') return null;
    const email = payload.email as string | undefined;
    const role = payload.role as string | undefined;
    const tenantId = payload.tenantId as string | undefined;
    if (!email || !role) return null;
    if (!tenantId || typeof tenantId !== 'string') return null;
    return {
      sub,
      email,
      role,
      tenantId,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function isJwtConfigured(): boolean {
  const s = process.env.JWT_SECRET;
  return Boolean(s && s.length >= 32);
}
