/**
 * TT-106: Mapeo resource_link_id (LTI) → courseId (TalentOS).
 * La plataforma envía resource_link.id en el id_token; aquí resolvemos a nuestro curso local.
 */

/** Mapa resource_link_id → courseId. Origen: env LTI_RESOURCE_LINK_MAP (JSON) o registro en BD en el futuro. */
let resourceLinkMap: Record<string, string> = {};

function loadResourceLinkMap(): void {
  const raw = process.env.LTI_RESOURCE_LINK_MAP;
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    resourceLinkMap = { ...resourceLinkMap, ...parsed };
  } catch {
    // ignore invalid JSON
  }
}

loadResourceLinkMap();

/**
 * Devuelve el courseId de TalentOS asociado a un resource_link_id de la plataforma LTI.
 * Si no hay mapeo, devuelve null.
 */
export function getCourseIdByResourceLinkId(resourceLinkId: string): string | null {
  if (!resourceLinkId) return null;
  return resourceLinkMap[resourceLinkId] ?? null;
}

/**
 * URL base de la app para construir redirects a cursos.
 */
function getAppBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!base) return '';
  return base.startsWith('http') ? base : `https://${base}`;
}

/**
 * Devuelve la URL a la que redirigir tras un launch con resource_link:
 * página del curso o, si se desea, directamente al visor SCORM (según configuración).
 */
export function getLaunchRedirectUrl(courseId: string, openScorm = false): string {
  const base = getAppBaseUrl();
  if (!base) return `/dashboard/courses/${courseId}`;
  const path = openScorm
    ? `/dashboard/courses/${courseId}/scorm-player`
    : `/dashboard/courses/${courseId}`;
  return `${base}${path}`;
}
