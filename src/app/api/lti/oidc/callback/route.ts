/**
 * TT-105: LTI 1.3 OIDC Callback.
 * La plataforma envía aquí el id_token y state (form_post).
 * Verificamos state, verificamos id_token con JWKS, creamos sesión y redirigimos a target_link_uri.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLtiPlatformConfig } from '@/lib/lti/config';
import { verifyState, verifyLtiIdToken } from '@/lib/lti/oidc';
import { getCourseIdByResourceLinkId, getLaunchRedirectUrl } from '@/lib/lti';
import { signSessionToken, isJwtConfigured } from '@/lib/auth/jwt';
import { logAuthSuccess } from '@/lib/audit';

const AUTH_COOKIE = 'auth-token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
};

export async function POST(request: NextRequest) {
  if (!isJwtConfigured()) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const formData = await request.formData();
  const id_token = formData.get('id_token') as string | null;
  const state = formData.get('state') as string | null;

  if (!id_token || !state) {
    return NextResponse.json({ error: 'Missing id_token or state in form body' }, { status: 400 });
  }

  const statePayload = await verifyState(state);
  if (!statePayload) {
    return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 });
  }

  const platform = getLtiPlatformConfig(statePayload.iss);
  if (!platform) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  const payload = await verifyLtiIdToken(
    id_token,
    platform,
    statePayload.nonce,
    platform.client_id
  );
  if (!payload) {
    return NextResponse.json({ error: 'Invalid id_token' }, { status: 401 });
  }

  const tenantId =
    process.env.LTI_TENANT_ID ||
    process.env.TENANT_ID_DEFAULT ||
    '00000000-0000-4000-8000-000000000001';
  const sub = `lti_${payload.iss}_${payload.sub}`.slice(0, 255);
  const email = payload.email || `${payload.sub}@lti.user`;
  const role = 'Trabajador';

  logAuthSuccess(tenantId, sub);
  const token = await signSessionToken({ sub, email, role, tenantId });
  const store = await cookies();
  store.set(AUTH_COOKIE, token, COOKIE_OPTS);

  // TT-106: si el token incluye resource_link.id y tenemos mapeo, redirigir al curso local
  const resourceLink = payload['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
  const resourceLinkId = resourceLink?.id;
  if (resourceLinkId) {
    const courseId = getCourseIdByResourceLinkId(resourceLinkId);
    if (courseId) {
      const redirectUrl = getLaunchRedirectUrl(courseId, false);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(statePayload.target_link_uri);
}
