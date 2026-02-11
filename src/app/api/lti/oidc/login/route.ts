/**
 * TT-105: LTI 1.3 OIDC Login Initiation.
 * La plataforma redirige aquí con iss, login_hint, target_link_uri, client_id, etc.
 * Redirigimos al usuario al endpoint de autorización de la plataforma con state y nonce.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLtiPlatformConfig } from '@/lib/lti/config';
import { buildPlatformAuthRedirectUrl } from '@/lib/lti/oidc';
import type { LtiOidcLoginParams } from '@/lib/lti/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const iss = searchParams.get('iss');
  const login_hint = searchParams.get('login_hint');
  const target_link_uri = searchParams.get('target_link_uri');
  const client_id = searchParams.get('client_id');
  const lti_message_hint = searchParams.get('lti_message_hint') ?? undefined;
  const lti_deployment_id = searchParams.get('lti_deployment_id') ?? undefined;

  if (!iss || !login_hint || !target_link_uri || !client_id) {
    return NextResponse.json(
      { error: 'Missing required LTI OIDC parameters: iss, login_hint, target_link_uri, client_id' },
      { status: 400 }
    );
  }

  const platform = getLtiPlatformConfig(iss);
  if (!platform) {
    return NextResponse.json(
      { error: 'Unknown or unconfigured LTI platform', iss },
      { status: 400 }
    );
  }

  const params: LtiOidcLoginParams = {
    iss,
    login_hint,
    target_link_uri,
    client_id,
    lti_message_hint,
    lti_deployment_id,
  };

  try {
    const { url } = await buildPlatformAuthRedirectUrl(params, platform);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[LTI OIDC] Login initiation error', err);
    return NextResponse.json(
      { error: 'Failed to build authorization redirect' },
      { status: 500 }
    );
  }
}
