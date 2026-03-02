/**
 * TT-109: Almacén de auditoría en memoria (sustituible por PostgreSQL en TT-116).
 */

import type { AuditLogEntry, AuditEventKind } from './types';

const entries: AuditLogEntry[] = [];
let idSeq = 0;

function nextId(): string {
  return `mem-${Date.now()}-${++idSeq}`;
}

export const memoryStore = {
  async append(
    tenantId: string,
    entry: { eventKind: AuditEventKind; userId?: string | null; details: Record<string, unknown> }
  ): Promise<void> {
    const createdAt = new Date().toISOString();
    entries.push({
      id: nextId(),
      tenantId,
      eventKind: entry.eventKind,
      userId: entry.userId ?? null,
      details: entry.details ?? {},
      createdAt,
    });
  },

  async getByTenant(
    tenantId: string,
    options?: { limit?: number; from?: string; to?: string }
  ): Promise<AuditLogEntry[]> {
    let list = entries.filter(e => e.tenantId === tenantId);
    if (options?.from) list = list.filter(e => e.createdAt >= options.from!);
    if (options?.to) list = list.filter(e => e.createdAt <= options.to!);
    list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    const limit = options?.limit ?? 500;
    return list.slice(0, limit);
  },
};
