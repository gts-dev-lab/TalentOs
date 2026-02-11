/**
 * TT-116: Almacén de auditoría en PostgreSQL (tabla audit_logs con RLS).
 * Solo se usa cuando DB_PROVIDER=postgres y DATABASE_URL está definido.
 */

import type { AuditLogEntry, AuditEventKind } from './types';

let pgPool: import('pg').Pool | null = null;

async function getPool(): Promise<import('pg').Pool> {
  if (pgPool) return pgPool;
  const pg = await import('pg');
  const { Pool } = pg;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL required for audit PostgreSQL store');
  pgPool = new Pool({ connectionString });
  return pgPool;
}

export async function appendAuditLogPg(
  tenantId: string,
  entry: { eventKind: AuditEventKind; userId?: string | null; details: Record<string, unknown> }
): Promise<void> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('SET app.current_tenant_id = $1', [tenantId]);
    await client.query(
      `INSERT INTO public.audit_logs (tenant_id, event_kind, user_id, details, created_at)
       VALUES ($1, $2, $3, $4, (now() AT TIME ZONE 'UTC'))`,
      [
        tenantId,
        entry.eventKind,
        entry.userId ?? null,
        JSON.stringify(entry.details ?? {}),
      ]
    );
  } finally {
    client.release();
  }
}

export async function getAuditLogsByTenantPg(
  tenantId: string,
  options?: { limit?: number; from?: string; to?: string }
): Promise<AuditLogEntry[]> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('SET app.current_tenant_id = $1', [tenantId]);
    const limit = Math.min(options?.limit ?? 500, 1000);
    let query = `
      SELECT id, tenant_id AS "tenantId", event_kind AS "eventKind", user_id AS "userId",
             details, created_at AS "createdAt"
      FROM public.audit_logs
      WHERE tenant_id = $1
    `;
    const params: (string | number)[] = [tenantId];
    let idx = 2;
    if (options?.from) {
      query += ` AND created_at >= $${idx}`;
      params.push(options.from);
      idx++;
    }
    if (options?.to) {
      query += ` AND created_at <= $${idx}`;
      params.push(options.to);
      idx++;
    }
    query += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);
    const result = await client.query(query, params);
    return result.rows.map((row: any) => ({
      id: String(row.id),
      tenantId: row.tenantId,
      eventKind: row.eventKind,
      userId: row.userId ?? null,
      details: typeof row.details === 'object' ? row.details : {},
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    }));
  } finally {
    client.release();
  }
}

export function isPostgresAuditEnabled(): boolean {
  return process.env.DB_PROVIDER === 'postgres' && !!process.env.DATABASE_URL;
}
