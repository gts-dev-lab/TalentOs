// @ts-nocheck
/**
 * TT-110: Módulo ARCO/RGPD — exportación de datos y derecho al olvido.
 * - Exportación en formato legible por máquina (JSON).
 * - Borrado lógico (soft delete) con plazos de bloqueo.
 * - Notificación al interesado en caso de supresión.
 */

import type { User } from '@/lib/types';
import { db } from '@/lib/db';

/** Plazo de retención del borrado lógico (días). Tras este plazo se puede considerar borrado definitivo según política. */
export const SOFT_DELETE_RETENTION_DAYS = 30;

export type GdprExportPayload = {
  exportedAt: string; // ISO 8601 UTC
  userId: string;
  profile: Omit<User, 'passwordHash'> & { passwordHash?: never };
  enrollments: Awaited<ReturnType<typeof db.getEnrollmentsForStudent>>;
  userProgress: Awaited<ReturnType<typeof db.getUserProgressForUser>>;
  certificates: Awaited<ReturnType<typeof db.getCertificatesForUser>>;
  notifications: Awaited<ReturnType<typeof db.getNotificationsForUser>>;
  forumMessages: { courseId: string; message: string; timestamp: string }[];
  externalTrainings: Awaited<ReturnType<typeof db.getExternalTrainingsForUser>>;
  learningPathsProgress: Awaited<ReturnType<typeof db.getLearningPathsForUser>>;
  badges: Awaited<ReturnType<typeof db.getBadgesForUser>>;
  pdis: Awaited<ReturnType<typeof db.getPDIsForUser>>;
  regulationCompliance: Awaited<ReturnType<typeof db.getComplianceForUser>>;
  courseRatings: { courseId: string; rating: number; instructorRating: number; timestamp?: string }[];
};

/**
 * Exporta todos los datos del usuario en formato legible por máquina (ARCO — derecho de acceso).
 * Excluye passwordHash. Para uso desde el cliente (Dexie) o desde un backend que exponga los mismos datos.
 */
export async function exportUserData(userId: string): Promise<GdprExportPayload | null> {
  const user = await db.getUserById(userId);
  if (!user) return null;

  const [
    enrollments,
    userProgress,
    certificates,
    notifications,
    externalTrainings,
    learningPathsProgress,
    badges,
    pdis,
    regulationCompliance,
  ] = await Promise.all([
    db.getEnrollmentsForStudent(userId),
    db.getUserProgressForUser(userId),
    db.getCertificatesForUser(userId),
    db.getNotificationsForUser(userId),
    db.getExternalTrainingsForUser(userId),
    db.getLearningPathsForUser(user),
    db.getBadgesForUser(userId),
    db.getPDIsForUser(userId),
    db.getComplianceForUser(userId),
  ]);

  const { passwordHash: _, ...profile } = user;
  const forumMessages = await getForumMessagesByUserId(userId);
  const courseRatings = await getCourseRatingsByUserId(userId);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile as GdprExportPayload['profile'],
    enrollments,
    userProgress,
    certificates,
    notifications,
    forumMessages,
    externalTrainings,
    learningPathsProgress,
    badges,
    pdis,
    regulationCompliance,
    courseRatings,
  };
}

async function getForumMessagesByUserId(userId: string): Promise<{ courseId: string; message: string; timestamp: string }[]> {
  const dexie = db.db as { forumMessages?: { where: (key: string) => { equals: (v: string) => { toArray: () => Promise<{ courseId: string; message: string; timestamp: string }[]> } } } };
  if (!dexie?.forumMessages) return [];
  const messages = await dexie.forumMessages.where('userId').equals(userId).toArray();
  return messages.map((m) => ({ courseId: m.courseId, message: m.message, timestamp: m.timestamp }));
}

async function getCourseRatingsByUserId(userId: string): Promise<{ courseId: string; rating: number; instructorRating: number; timestamp?: string }[]> {
  const dexie = db.db as { courseRatings?: { toArray: () => Promise<{ userId: string; courseId: string; rating: number; instructorRating: number; timestamp?: string }[]> } };
  if (!dexie?.courseRatings) return [];
  const all = await dexie.courseRatings.toArray();
  return all
    .filter((r) => r.userId === userId)
    .map((r) => ({ courseId: r.courseId, rating: r.rating, instructorRating: r.instructorRating, timestamp: r.timestamp }));
}

/**
 * Solicita el borrado lógico (derecho al olvido). Establece deletedAt en el usuario.
 * El usuario deja de ser visible en listados y no puede iniciar sesión.
 * Opcionalmente notifica al interesado por email.
 */
export async function requestErasure(userId: string, options?: { notify?: boolean }): Promise<{ ok: boolean; email?: string; error?: string }> {
  const user = await db.getUserById(userId);
  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (user.deletedAt) return { ok: false, error: 'El usuario ya fue eliminado' };

  const email = user.email;
  const updated = await db.softDeleteUser(userId);
  if (updated === 0) return { ok: false, error: 'No se pudo aplicar el borrado' };

  if (options?.notify !== false && email) {
    await notifyDataSubjectErasure(email, userId);
  }
  return { ok: true, email };
}

/**
 * Notifica al interesado que sus datos han sido suprimidos (RGPD).
 * Usa el servicio de notificaciones existente o registra en log si no está configurado.
 */
export async function notifyDataSubjectErasure(email: string, _userId: string): Promise<void> {
  const message = 'Sus datos personales han sido eliminados de acuerdo con su solicitud (derecho al olvido, RGPD).';
  try {
    const { sendEmail } = await import('@/lib/notification-service');
    const React = await import('react');
    const { NotificationEmail } = await import('@/emails/notification');
    await sendEmail({
      to: email,
      subject: 'Confirmación de supresión de datos - TalentOS',
      react: React.createElement(NotificationEmail, {
        userName: 'Usuario',
        emailSubject: 'Confirmación de supresión de datos',
        emailBody: message,
      }),
    });
  } catch (err) {
    if (typeof window !== 'undefined') {
      import('@/lib/db').then(({ db: d }) => d.logSystemEvent('WARN', 'GDPR: notificación de supresión no enviada', { email })).catch(() => {});
    }
  }
}
