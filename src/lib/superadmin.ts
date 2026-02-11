/**
 * Superadministrador: figura configurada por variables de entorno.
 * Tiene acceso a todas las configuraciones, aprobación de accesos y menús.
 *
 * Configuración en .env o .env.local:
 *   NEXT_PUBLIC_SUPERADMIN_EMAILS=admin@empresa.com,otro@empresa.com
 * (varios emails separados por coma; sin espacios o con espacios, se hace trim)
 */

const ENV_KEY = 'NEXT_PUBLIC_SUPERADMIN_EMAILS';

function parseSuperadminEmails(): string[] {
  if (typeof process === 'undefined' || !process.env) return [];
  const raw = process.env[ENV_KEY];
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Indica si el email dado pertenece a un superadministrador.
 * Usar en cliente y en servidor (la variable NEXT_PUBLIC_* está disponible en ambos).
 */
export function isSuperadmin(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const list = parseSuperadminEmails();
  return list.includes(email.trim().toLowerCase());
}

/**
 * Lista de emails configurados como superadmin (útil para mostrar en ajustes).
 * En cliente solo usar donde sea seguro (ej. página de administración).
 */
export function getSuperadminEmails(): string[] {
  return parseSuperadminEmails();
}
