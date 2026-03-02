/**
 * TT-111: Exportación completa desde IndexedDB para migración a PostgreSQL.
 * Uso: desde la app (navegador), llamar a exportAllDataForMigration() y guardar el JSON.
 * Luego ejecutar el script Node scripts/migrate-indexeddb-to-postgres.mjs con ese archivo.
 */

import * as db from '@/lib/db';

/** Formato del payload exportado (alineado con tablas en migrations/002_schema_talentos.sql). */
export type MigrationExportPayload = {
  exportedAt: string;
  users: Array<Record<string, unknown>>;
  courses: Array<Record<string, unknown>>;
  enrollments: Array<Record<string, unknown>>;
  userProgress: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  certificates: Array<Record<string, unknown>>;
  certificateTemplates: Array<Record<string, unknown>>;
  forumMessages: Array<Record<string, unknown>>;
  externalTrainings: Array<Record<string, unknown>>;
  costs: Array<Record<string, unknown>>;
  costCategories: Array<Record<string, unknown>>;
  badges: Array<Record<string, unknown>>;
  userBadges: Array<Record<string, unknown>>;
  learningPaths: Array<Record<string, unknown>>;
  userLearningPathProgress: Array<Record<string, unknown>>;
  courseRatings: Array<Record<string, unknown>>;
  individualDevelopmentPlans: Array<Record<string, unknown>>;
  regulations: Array<Record<string, unknown>>;
  regulationCompliance: Array<Record<string, unknown>>;
  complianceAudits: Array<Record<string, unknown>>;
  scormCmiState: Array<Record<string, unknown>>;
};

function omitBlobs<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  if ('scormPackage' in out) (out as Record<string, unknown>).scormPackage = null;
  return out;
}

/**
 * Exporta todos los datos de Dexie para migración a PostgreSQL.
 * Excluye usuarios con deletedAt. Excluye Blobs (scormPackage).
 * Ejecutar en el navegador (donde db está disponible).
 */
export async function exportAllDataForMigration(): Promise<MigrationExportPayload> {
  const dexie = db.db as {
    users?: { toArray: () => Promise<unknown[]> };
    courses?: { toArray: () => Promise<unknown[]> };
    enrollments?: { toArray: () => Promise<unknown[]> };
    userProgress?: { toArray: () => Promise<unknown[]> };
    notifications?: { toArray: () => Promise<unknown[]> };
    forumMessages?: { toArray: () => Promise<unknown[]> };
    externalTrainings?: { toArray: () => Promise<unknown[]> };
    costs?: { toArray: () => Promise<unknown[]> };
    costCategories?: { toArray: () => Promise<unknown[]> };
    badges?: { toArray: () => Promise<unknown[]> };
    userBadges?: { toArray: () => Promise<unknown[]> };
    learningPaths?: { toArray: () => Promise<unknown[]> };
    userLearningPathProgress?: { toArray: () => Promise<unknown[]> };
    courseRatings?: { toArray: () => Promise<unknown[]> };
    individualDevelopmentPlans?: { toArray: () => Promise<unknown[]> };
    regulations?: { toArray: () => Promise<unknown[]> };
    regulationCompliance?: { toArray: () => Promise<unknown[]> };
    complianceAudits?: { toArray: () => Promise<unknown[]> };
    scormCmiState?: { toArray: () => Promise<unknown[]> };
  };

  const users = await db.getAllUsers();
  const usersFiltered = users.filter(u => !(u as { deletedAt?: string }).deletedAt);

  const [
    courses,
    enrollments,
    userProgress,
    notifications,
    certificates,
    certificateTemplates,
    forumMessages,
    externalTrainings,
    costs,
    costCategories,
    badges,
    userBadges,
    learningPaths,
    userLearningPathProgress,
    courseRatings,
    individualDevelopmentPlans,
    regulations,
    regulationCompliance,
    complianceAudits,
    scormCmiState,
  ] = await Promise.all([
    db.getAllCourses(),
    dexie.enrollments?.toArray() ?? [],
    dexie.userProgress?.toArray() ?? [],
    dexie.notifications?.toArray() ?? [],
    db.getAllCertificates(),
    db.getCertificateTemplates(),
    dexie.forumMessages?.toArray() ?? [],
    dexie.externalTrainings?.toArray() ?? [],
    db.getAllCosts(),
    db.getAllCostCategories(),
    db.getAllBadges(),
    dexie.userBadges?.toArray() ?? [],
    db.getAllLearningPaths(),
    dexie.userLearningPathProgress?.toArray() ?? [],
    dexie.courseRatings?.toArray() ?? [],
    dexie.individualDevelopmentPlans?.toArray() ?? [],
    dexie.regulations?.toArray() ?? [],
    dexie.regulationCompliance?.toArray() ?? [],
    dexie.complianceAudits?.toArray() ?? [],
    dexie.scormCmiState?.toArray() ?? [],
  ]);

  const courseList = Array.isArray(courses)
    ? courses.map(c => omitBlobs(c as Record<string, unknown>))
    : [];

  return {
    exportedAt: new Date().toISOString(),
    users: usersFiltered as Record<string, unknown>[],
    courses: courseList,
    enrollments: (enrollments ?? []) as Record<string, unknown>[],
    userProgress: (userProgress ?? []) as Record<string, unknown>[],
    notifications: (notifications ?? []) as Record<string, unknown>[],
    certificates: (certificates ?? []) as Record<string, unknown>[],
    certificateTemplates: (certificateTemplates ?? []) as Record<string, unknown>[],
    forumMessages: (forumMessages ?? []) as Record<string, unknown>[],
    externalTrainings: (externalTrainings ?? []) as Record<string, unknown>[],
    costs: (costs ?? []) as Record<string, unknown>[],
    costCategories: (costCategories ?? []) as Record<string, unknown>[],
    badges: (badges ?? []) as Record<string, unknown>[],
    userBadges: (userBadges ?? []) as Record<string, unknown>[],
    learningPaths: (learningPaths ?? []) as Record<string, unknown>[],
    userLearningPathProgress: (userLearningPathProgress ?? []) as Record<string, unknown>[],
    courseRatings: (courseRatings ?? []) as Record<string, unknown>[],
    individualDevelopmentPlans: (individualDevelopmentPlans ?? []) as Record<string, unknown>[],
    regulations: (regulations ?? []) as Record<string, unknown>[],
    regulationCompliance: (regulationCompliance ?? []) as Record<string, unknown>[],
    complianceAudits: (complianceAudits ?? []) as Record<string, unknown>[],
    scormCmiState: (scormCmiState ?? []) as Record<string, unknown>[],
  };
}
