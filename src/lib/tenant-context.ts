/**
 * TT-102: Contexto de inquilino para el ciclo de vida de la petición.
 * Equivalente a ContextVar en Python: permite que la capa de servicio
 * acceda al tenant_id sin pasarlo explícitamente.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { verifySessionToken, type SessionPayload } from '@/lib/auth/jwt';

const AUTH_COOKIE = 'auth-token';

export type TenantContext = {
  tenantId: string;
  session: SessionPayload;
};

const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Ejecuta `fn` con el contexto de inquilino disponible.
 * Dentro de `fn`, getCurrentTenantId() y getCurrentSession() devuelven los valores de esta petición.
 */
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

/**
 * Ejecuta `fn` de forma asíncrona con el contexto de inquilino.
 */
export async function runWithTenantAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    tenantStorage.run(context, () => {
      Promise.resolve(fn()).then(resolve, reject);
    });
  });
}

/**
 * Devuelve el tenant_id del contexto actual (establecido por runWithTenant).
 * Fuera de una petición protegida devuelve null.
 */
export function getCurrentTenantId(): string | null {
  const ctx = tenantStorage.getStore();
  return ctx?.tenantId ?? null;
}

/**
 * Devuelve la sesión completa del contexto actual.
 */
export function getCurrentSession(): SessionPayload | null {
  const ctx = tenantStorage.getStore();
  return ctx?.session ?? null;
}

/**
 * Parsea el valor de una cookie por nombre desde el header Cookie.
 */
function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((s) => s.trim());
  for (const part of parts) {
    const [key, ...v] = part.split('=');
    if (key?.toLowerCase() === name.toLowerCase()) {
      return v.join('=').trim() || null;
    }
  }
  return null;
}

/**
 * Obtiene la sesión (JWT verificado) a partir de la petición.
 * Lee la cookie auth-token y verifica el JWT; exige tenantId en el payload.
 * Devuelve null si no hay cookie, token inválido o falta tenantId.
 */
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const token = getCookieFromRequest(request, AUTH_COOKIE);
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.tenantId) return null;
  return payload;
}

/**
 * Obtiene el contexto de inquilino para la petición.
 * Devuelve null si la petición no está autenticada o carece de tenant_id válido.
 */
export async function getTenantContextFromRequest(request: Request): Promise<TenantContext | null> {
  const session = await getSessionFromRequest(request);
  if (!session) return null;
  return { tenantId: session.tenantId, session };
}

/**
 * Tipo de respuesta estándar para requireTenant cuando no hay sesión (401).
 */
export type RequireTenantUnauthorized = { type: 'unauthorized'; status: 401 };

/**
 * Ejecuta el handler con el contexto de inquilino.
 * Si la petición no tiene sesión válida con tenant_id, devuelve { type: 'unauthorized', status: 401 }
 * para que la ruta responda con 401. Uso en API routes:
 *
 * const result = await requireTenant(request, async () => {
 *   const tenantId = getCurrentTenantId();
 *   // ... lógica que usa tenantId
 *   return NextResponse.json({ ok: true });
 * });
 * if (result?.type === 'unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * return result;
 */
export async function requireTenant<T>(
  request: Request,
  handler: () => Promise<T>
): Promise<T | RequireTenantUnauthorized> {
  const ctx = await getTenantContextFromRequest(request);
  if (!ctx) return { type: 'unauthorized', status: 401 };
  return runWithTenantAsync(ctx, handler);
}
