#!/usr/bin/env node
/**
 * TT-111: Script de carga IndexedDB (export JSON) → PostgreSQL.
 * Uso: node scripts/migrate-indexeddb-to-postgres.mjs <export.json> <tenant_uuid> [database_url]
 * Requiere: npm install pg
 * El JSON se obtiene desde la app (Export for migration) y debe contener users, courses, enrollments, userProgress, etc.
 */

import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const args = process.argv.slice(2);
const jsonPath = args[0];
const tenantId = args[1];
const databaseUrl = args[2] || process.env.DATABASE_URL;

if (!jsonPath || !tenantId) {
  console.error(
    'Uso: node scripts/migrate-indexeddb-to-postgres.mjs <export.json> <tenant_uuid> [DATABASE_URL]'
  );
  process.exit(1);
}
if (!databaseUrl) {
  console.error('Indica DATABASE_URL (env o tercer argumento).');
  process.exit(1);
}

let pg;
try {
  pg = await import('pg');
} catch (e) {
  console.error('Instala pg: npm install pg');
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
const userIdMap = new Map();
const courseIdMap = new Map();
const certTemplateIdMap = new Map();
const badgeIdMap = new Map();

function mapId(oldId, map, prefix = '') {
  if (map.has(oldId)) return map.get(oldId);
  const newId = randomUUID();
  map.set(String(oldId), newId);
  return newId;
}

const client = new pg.default.Client({ connectionString: databaseUrl });
await client.connect();

try {
  console.log('Insertando usuarios...');
  for (const u of data.users || []) {
    const newId = mapId(u.id, userIdMap);
    await client.query(
      `INSERT INTO public.users (id, tenant_id, name, email, password_hash, phone, avatar, role, department, points, status, notification_settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13::timestamptz, NOW()), COALESCE($14::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [
        newId,
        tenantId,
        u.name ?? '',
        u.email ?? '',
        u.passwordHash ?? null,
        u.phone ?? null,
        u.avatar ?? '',
        u.role ?? 'Trabajador',
        u.department ?? '',
        Number(u.points) || 0,
        u.status ?? 'approved',
        JSON.stringify(u.notificationSettings ?? { consent: false, channels: [] }),
        u.updatedAt ?? null,
        u.updatedAt ?? null,
      ]
    );
  }

  console.log('Insertando cursos...');
  for (const c of data.courses || []) {
    const newId = mapId(c.id, courseIdMap);
    await client.query(
      `INSERT INTO public.courses (id, tenant_id, title, description, long_description, instructor, duration, modality, image, ai_hint, modules, status, mandatory_for_roles, start_date, end_date, category, capacity, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::timestamptz, $15::timestamptz, $16, $17, COALESCE($18::timestamptz, NOW()), COALESCE($19::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [
        newId,
        tenantId,
        c.title ?? '',
        c.description ?? '',
        c.longDescription ?? '',
        c.instructor ?? '',
        c.duration ?? '',
        c.modality ?? 'Online',
        c.image ?? '',
        c.aiHint ?? '',
        JSON.stringify(c.modules ?? []),
        c.status ?? 'draft',
        c.mandatoryForRoles || [] || [],
        c.startDate ?? null,
        c.endDate ?? null,
        c.category ?? null,
        c.capacity ?? null,
        c.updatedAt ?? null,
        c.updatedAt ?? null,
      ]
    );
  }

  console.log('Insertando matriculaciones...');
  for (const e of data.enrollments || []) {
    const studentId = userIdMap.get(String(e.studentId)) ?? e.studentId;
    const courseId = courseIdMap.get(String(e.courseId)) ?? e.courseId;
    if (!userIdMap.has(String(e.studentId)) || !courseIdMap.has(String(e.courseId))) continue;
    await client.query(
      `INSERT INTO public.enrollments (tenant_id, student_id, course_id, request_date, status, justification, created_at, updated_at)
       VALUES ($1, $2, $3, $4::timestamptz, $5, $6, COALESCE($7::timestamptz, NOW()), COALESCE($8::timestamptz, NOW()))
       ON CONFLICT (tenant_id, student_id, course_id) DO NOTHING`,
      [
        tenantId,
        studentId,
        courseId,
        e.requestDate ?? new Date().toISOString(),
        e.status ?? 'pending',
        e.justification ?? null,
        e.updatedAt ?? null,
        e.updatedAt ?? null,
      ]
    );
  }

  console.log('Insertando progreso de usuario...');
  for (const p of data.userProgress || []) {
    const uid = userIdMap.get(String(p.userId));
    const cid = courseIdMap.get(String(p.courseId));
    if (!uid || !cid) continue;
    await client.query(
      `INSERT INTO public.user_progress (tenant_id, user_id, course_id, completed_modules, created_at, updated_at)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), COALESCE($6::timestamptz, NOW()))
       ON CONFLICT (tenant_id, user_id, course_id) DO UPDATE SET completed_modules = EXCLUDED.completed_modules, updated_at = EXCLUDED.updated_at`,
      [tenantId, uid, cid, p.completedModules || [] || [], p.updatedAt ?? null, p.updatedAt ?? null]
    );
  }

  console.log('Insertando notificaciones...');
  for (const n of data.notifications || []) {
    const uid = userIdMap.get(String(n.userId));
    if (!uid) continue;
    await client.query(
      `INSERT INTO public.notifications (tenant_id, user_id, message, type, related_url, is_read, timestamp, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, COALESCE($8::timestamptz, NOW()), COALESCE($9::timestamptz, NOW()))`,
      [
        tenantId,
        uid,
        n.message ?? '',
        n.type ?? 'course_announcement',
        n.relatedUrl ?? null,
        Boolean(n.isRead),
        n.timestamp ?? new Date().toISOString(),
        n.updatedAt ?? null,
        n.updatedAt ?? null,
      ]
    );
  }

  if ((data.certificateTemplates || []).length === 0) {
    const defaultTplId = randomUUID();
    certTemplateIdMap.set('__default__', defaultTplId);
    await client.query(
      `INSERT INTO public.certificate_templates (id, tenant_id, name, type, description, is_active, created_at, updated_at)
       VALUES ($1, $2, 'Plantilla por defecto', 'completion', 'Migración', true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [defaultTplId, tenantId]
    );
  } else {
    for (const t of data.certificateTemplates || []) {
      const newId = mapId(t.id, certTemplateIdMap);
      await client.query(
        `INSERT INTO public.certificate_templates (id, tenant_id, name, type, description, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, NOW()), COALESCE($8::timestamptz, NOW()))
         ON CONFLICT (id) DO NOTHING`,
        [
          newId,
          tenantId,
          t.name ?? '',
          t.type ?? 'completion',
          t.description ?? null,
          t.isActive !== false,
          t.createdAt ?? null,
          t.updatedAt ?? null,
        ]
      );
    }
  }

  const defaultTplId =
    certTemplateIdMap.get('__default__') || Array.from(certTemplateIdMap.values())[0];
  console.log('Insertando certificados...');
  for (const c of data.certificates || []) {
    const uid = userIdMap.get(String(c.userId));
    const cid = courseIdMap.get(String(c.courseId));
    const tplId = c.templateId ? certTemplateIdMap.get(String(c.templateId)) : defaultTplId;
    if (!uid || !cid || !tplId) continue;
    const newId = randomUUID();
    await client.query(
      `INSERT INTO public.certificates (id, tenant_id, user_id, course_id, template_id, verification_code, issued_at, expires_at, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, COALESCE($10::timestamptz, NOW()), COALESCE($11::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [
        newId,
        tenantId,
        uid,
        cid,
        tplId,
        c.verificationCode ?? randomUUID().slice(0, 8),
        c.issuedAt ?? new Date().toISOString(),
        c.expiresAt ?? null,
        c.status ?? 'active',
        c.updatedAt ?? null,
        c.updatedAt ?? null,
      ]
    );
  }

  console.log('Insertando scorm_cmi_state (si existe tabla)...');
  for (const s of data.scormCmiState || []) {
    const uid = userIdMap.get(String(s.userId));
    const cid = courseIdMap.get(String(s.courseId));
    if (!uid || !cid) continue;
    try {
      await client.query(
        `INSERT INTO public.scorm_cmi_state (tenant_id, user_id, course_id, completion_status, success_status, score_scaled, location, suspend_data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)
         ON CONFLICT (tenant_id, user_id, course_id) DO UPDATE SET completion_status = EXCLUDED.completion_status, success_status = EXCLUDED.success_status, score_scaled = EXCLUDED.score_scaled, location = EXCLUDED.location, suspend_data = EXCLUDED.suspend_data, updated_at = EXCLUDED.updated_at`,
        [
          tenantId,
          uid,
          cid,
          s.completionStatus ?? 'incomplete',
          s.successStatus ?? 'unknown',
          Number(s.scoreScaled) ?? 0,
          (s.location ?? '').slice(0, 1000),
          s.suspendData ?? '',
          s.updatedAt ?? new Date().toISOString(),
        ]
      );
    } catch (err) {
      if (err.code !== '42P01') throw err;
    }
  }

  console.log('Migración completada.');
} finally {
  await client.end();
}
