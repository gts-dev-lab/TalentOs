/**
 * TT-113: Tests de seguridad del middleware (aislamiento y auth).
 * Verifica que las rutas /api/* protegidas devuelvan 401 sin token, con token inválido o sin tenantId.
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

jest.mock('@/lib/auth/jwt', () => ({
  verifySessionToken: jest.fn(),
  isJwtConfigured: jest.fn(() => true),
}));

const jwt = require('@/lib/auth/jwt') as {
  verifySessionToken: jest.Mock;
  isJwtConfigured: jest.Mock;
};

function createRequest(path: string, cookieValue?: string): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set('Cookie', `auth-token=${cookieValue}`);
  }
  return new NextRequest(url, { headers });
}

describe('Middleware TT-102 / TT-113', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.isJwtConfigured.mockReturnValue(true);
  });

  it('permite acceso a rutas públicas sin token (login, session, logout, nextauth, lti)', async () => {
    const paths = [
      '/api/auth/login',
      '/api/auth/session',
      '/api/auth/logout',
      '/api/nextauth',
      '/api/lti/oidc/login',
    ];
    for (const path of paths) {
      const req = createRequest(path);
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(jwt.verifySessionToken).not.toHaveBeenCalled();
    }
    jwt.verifySessionToken.mockClear();
  });

  it('devuelve 401 en ruta protegida sin cookie auth-token', async () => {
    const req = createRequest('/api/some-protected-route');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toMatch(/missing|invalid|token/i);
    expect(jwt.verifySessionToken).not.toHaveBeenCalled();
  });

  it('devuelve 401 en ruta protegida con token inválido o expirado', async () => {
    jwt.verifySessionToken.mockResolvedValue(null);
    const req = createRequest('/api/users', 'invalid-or-expired-token');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toMatch(/invalid|expired/i);
    expect(jwt.verifySessionToken).toHaveBeenCalledWith('invalid-or-expired-token');
  });

  it('devuelve 401 cuando el token es válido pero no tiene tenantId', async () => {
    jwt.verifySessionToken.mockResolvedValue({
      sub: 'user-1',
      email: 'a@b.com',
      role: 'Administrador General',
      tenantId: undefined as unknown as string,
    });
    const req = createRequest('/api/courses', 'valid-token-no-tenant');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toMatch(/tenant|context/i);
  });

  it('permite acceso cuando el token es válido y tiene tenantId', async () => {
    jwt.verifySessionToken.mockResolvedValue({
      sub: 'user-1',
      email: 'a@b.com',
      role: 'Administrador General',
      tenantId: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
    });
    const req = createRequest('/api/courses', 'valid-token');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(jwt.verifySessionToken).toHaveBeenCalledWith('valid-token');
  });
});
