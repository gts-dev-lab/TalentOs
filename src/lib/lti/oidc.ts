/**
 * TT-105: Orquestador OIDC LTI 1.3 — construcción de auth URL y verificación de id_token con JWKS.
 */

import * as jose from 'jose';
import type {
  LtiPlatformConfig,
  LtiOidcLoginParams,
  LtiOidcStatePayload,
  LtiIdTokenPayload,
} from './types';
import { getLtiOidcCallbackUrl, getSecret } from './config';

const STATE_JWT_ALG = 'HS256';
const STATE_JWT_MAX_AGE = 600; // 10 min

/**
 * Genera nonce y state (JWT firmado) y construye la URL de autorización de la plataforma
 * para redirigir al usuario (paso 2 del flujo OIDC).
 */
export async function buildPlatformAuthRedirectUrl(
  params: LtiOidcLoginParams,
  platform: LtiPlatformConfig
): Promise<{ url: string; state: string; nonce: string }> {
  const nonce = crypto.randomUUID();
  const statePayload: LtiOidcStatePayload = {
    nonce,
    target_link_uri: params.target_link_uri,
    iss: params.iss,
    login_hint: params.login_hint,
    lti_message_hint: params.lti_message_hint,
    iat: Math.floor(Date.now() / 1000),
  };
  const secret = getSecret();
  const state = await new jose.SignJWT(statePayload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: STATE_JWT_ALG })
    .setExpirationTime(STATE_JWT_MAX_AGE)
    .sign(secret);

  const redirectUri = getLtiOidcCallbackUrl();
  const url = new URL(platform.auth_request_url);
  url.searchParams.set('scope', 'openid');
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('response_mode', 'form_post');
  url.searchParams.set('client_id', params.client_id);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('login_hint', params.login_hint);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  if (params.lti_message_hint) {
    url.searchParams.set('lti_message_hint', params.lti_message_hint);
  }
  if (params.lti_deployment_id) {
    url.searchParams.set('lti_deployment_id', params.lti_deployment_id);
  }

  return { url: url.toString(), state, nonce };
}

/**
 * Verifica el state JWT y devuelve el payload.
 */
export async function verifyState(state: string): Promise<LtiOidcStatePayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jose.jwtVerify(state, secret, {
      algorithms: [STATE_JWT_ALG],
      maxTokenAge: STATE_JWT_MAX_AGE,
    });
    return payload as unknown as LtiOidcStatePayload;
  } catch {
    return null;
  }
}

/**
 * Descarga el JWKS de la plataforma y verifica el id_token JWT.
 * Devuelve el payload del id_token si la firma y claims (iss, aud, nonce, exp) son válidos.
 */
export async function verifyLtiIdToken(
  idToken: string,
  platform: LtiPlatformConfig,
  expectedNonce: string,
  expectedClientId?: string
): Promise<LtiIdTokenPayload | null> {
  try {
    const JWKS = jose.createRemoteJWKSet(new URL(platform.jwks_uri));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: platform.iss,
      algorithms: ['RS256', 'RS384', 'RS512'],
    });

    const nonce = payload.nonce as string | undefined;
    if (!nonce || nonce !== expectedNonce) return null;

    if (expectedClientId) {
      const aud = payload.aud;
      const audMatch = Array.isArray(aud)
        ? aud.includes(expectedClientId)
        : aud === expectedClientId;
      if (!audMatch) return null;
    }

    return payload as unknown as LtiIdTokenPayload;
  } catch {
    return null;
  }
}
