/**
 * TT-109 / TT-116: Sistema centralizado de logs de auditoría.
 * Timestamps UTC (ISO 8601), detalles sanitizados (sin contraseñas ni tokens).
 * Almacén en memoria o PostgreSQL según DB_PROVIDER y DATABASE_URL.
 */

import type { AuditLogEntry, AuditEventKind } from './types';
import { memoryStore } from './memory-store';
import {
  appendAuditLogPg,
  getAuditLogsByTenantPg,
  isPostgresAuditEnabled,
} from './postgres-store';

/**
 * Registra un evento de auditoría (auth.login.success, auth.login.failure, auth.logout).
 * Escribe en PostgreSQL si DB_PROVIDER=postgres, sino en memoria.
 */
export async function logAudit(
  tenantId: string,
  eventKind: AuditEventKind,
  options?: { userId?: string | null; details?: Record<string, unknown> }
): Promise<void> {
  const details = options?.details ?? {};
  const sanitized = { ...details };
  if ('password' in sanitized) delete sanitized.password;
  if ('token' in sanitized) delete sanitized.token;
  if ('passwordHash' in sanitized) delete sanitized.passwordHash;

  if (isPostgresAuditEnabled()) {
    await appendAuditLogPg(tenantId, {
      eventKind,
      userId: options?.userId ?? null,
      details: sanitized,
    });
  } else {
    await memoryStore.append(tenantId, {
      eventKind,
      userId: options?.userId ?? null,
      details: sanitized,
    });
  }
}

/**
 * Obtiene los logs de auditoría de un inquilino.
 * Consulta PostgreSQL si está configurado, sino el almacén en memoria.
 */
export async function getAuditLogsByTenant(
  tenantId: string,
  options?: { limit?: number; from?: string; to?: string }
): Promise<AuditLogEntry[]> {
  if (isPostgresAuditEnabled()) {
    return getAuditLogsByTenantPg(tenantId, options);
  }
  return memoryStore.getByTenant(tenantId, options);
}

export type { AuditLogEntry, AuditEventKind };
export { memoryStore } from './memory-store';
export { isPostgresAuditEnabled } from './postgres-store';
