/**
 * TT-115: Integración SET app.current_tenant_id en API Routes.
 * Wrapper para ejecutar handlers de API con el contexto de inquilino establecido.
 * Cuando DB_PROVIDER=postgres, el provider usa getCurrentTenantId() y establece
 * SET app.current_tenant_id en cada conexión; este wrapper asegura que el handler
 * se ejecute dentro de runWithTenant().
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest, runWithTenant } from '@/lib/tenant-context';

export type ApiHandlerWithTenant = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Envuelve un handler de API Route para que se ejecute con el contexto de tenant.
 * Obtiene la sesión del request, establece el contexto (AsyncLocalStorage) y ejecuta el handler.
 * Si no hay sesión o tenantId, devuelve 401.
 *
 * Uso en cualquier API Route protegida que use la BD (Dexie o PostgreSQL):
 *
 *   export const GET = withTenant(async (request) => {
 *     const users = await db.getAllUsers(); // con PostgreSQL, RLS filtra por tenant
 *     return NextResponse.json(users);
 *   });
 *
 *   export const POST = withTenant(async (request) => {
 *     const body = await request.json();
 *     // ...
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withTenant(handler: ApiHandlerWithTenant): ApiHandlerWithTenant {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const session = await getSessionFromRequest(request);
    if (!session?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Tenant context required' },
        { status: 401 }
      );
    }

    return new Promise<NextResponse>((resolve, reject) => {
      runWithTenant({ tenantId: session.tenantId, session }, () => {
        handler(request, context).then(resolve, reject);
      });
    });
  };
}

/**
 * Comprueba si el provider actual es PostgreSQL.
 * Cuando es postgres, es obligatorio usar withTenant o requireTenant en las rutas que usen la BD.
 */
export function isPostgresProvider(): boolean {
  return process.env.DB_PROVIDER === 'postgres';
}
