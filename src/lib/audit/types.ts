/**
 * TT-109 / TT-116: Tipos para el sistema de auditoría.
 * Eventos inmutables con timestamp UTC (ISO 8601), sin contraseñas ni tokens.
 */

export type AuditEventKind = 'auth.login.success' | 'auth.login.failure' | 'auth.logout';

export interface AuditLogEntry {
  id?: string;
  tenantId: string;
  eventKind: AuditEventKind;
  userId?: string | null;
  details: Record<string, unknown>;
  createdAt: string; // ISO 8601 UTC
}

export interface AuditStore {
  append(
    tenantId: string,
    entry: Omit<AuditLogEntry, 'id' | 'tenantId' | 'createdAt'>
  ): Promise<void>;
  getByTenant(
    tenantId: string,
    options?: { limit?: number; from?: string; to?: string }
  ): Promise<AuditLogEntry[]>;
}
