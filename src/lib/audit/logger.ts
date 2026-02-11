/**
 * TT-109: Sistema centralizado de logs de auditoría.
 * Registra eventos de seguridad (auth, acceso) con timestamp UTC.
 * Logs sanitizados (sin contraseñas ni tokens); cada entrada atribuida a tenant_id.
 */

import { uuid } from '@/lib/uuid';
import type { AuditLogEntry, AuditEventKind, AuditDetails } from './types';

/** Almacén en memoria (inmutable: solo append). En producción sustituir por persistencia (PostgreSQL, etc.). */
const inMemoryStore: AuditLogEntry[] = [];
const MAX_IN_MEMORY = 10_000;

function nowUTC(): string {
  return new Date().toISOString();
}

function append(entry: AuditLogEntry): void {
  inMemoryStore.push(entry);
  if (inMemoryStore.length > MAX_IN_MEMORY) {
    inMemoryStore.splice(0, inMemoryStore.length - MAX_IN_MEMORY);
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', entry.event, entry.tenantId || '-', entry.userId || '-', entry.details);
  }
}

/**
 * Registra un evento de auditoría.
 * No incluir nunca password, token ni datos sensibles en details.
 */
export function auditLog(
  event: AuditEventKind,
  options: {
    tenantId?: string;
    userId?: string;
    details?: AuditDetails;
  } = {}
): void {
  const entry: AuditLogEntry = {
    id: uuid(),
    event,
    timestamp: nowUTC(),
    tenantId: options.tenantId ?? '',
    userId: options.userId ?? '',
    details: options.details ?? {},
  };
  append(entry);
}

/** Login exitoso. */
export function logAuthSuccess(tenantId: string, userId: string): void {
  auditLog('auth.login.success', { tenantId, userId, details: {} });
}

/** Login fallido. No incluir contraseña. */
export function logAuthFailure(options: {
  reason: string;
  code?: string;
  email?: string;
}): void {
  auditLog('auth.login.failure', {
    details: {
      reason: options.reason,
      code: options.code,
      email: options.email ? options.email.trim().toLowerCase().slice(0, 64) : undefined,
    },
  });
}

/** Cierre de sesión. */
export function logAuthLogout(tenantId: string, userId: string): void {
  auditLog('auth.logout', { tenantId, userId, details: {} });
}

/** Acceso denegado (ej. 401 por token inválido o sin tenant). */
export function logAccessDenied(options: { reason: string; code?: string }): void {
  auditLog('access.denied', { details: { reason: options.reason, code: options.code } });
}

/**
 * Devuelve las últimas entradas de auditoría (para admins / soporte).
 * En producción debería leerse desde BD con filtro por tenant_id.
 */
export function getRecentAuditLogs(limit = 500): AuditLogEntry[] {
  return [...inMemoryStore].slice(-limit).reverse();
}

/**
 * Devuelve entradas de auditoría filtradas por tenant (para RLS / multi-tenant).
 */
export function getAuditLogsByTenant(tenantId: string, limit = 500): AuditLogEntry[] {
  return inMemoryStore
    .filter((e) => e.tenantId === tenantId)
    .slice(-limit)
    .reverse();
}
