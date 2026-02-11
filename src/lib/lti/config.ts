/**
 * TT-105: Configuración de plataformas LTI 1.3.
 * Una sola plataforma por env; para varias, usar un store o JSON.
 */

import type { LtiPlatformConfig } from './types';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET required for LTI state signing (≥32 chars).');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Devuelve la configuración de la plataforma LTI por issuer.
 * Configuración vía env: LTI_ISSUER, LTI_AUTH_REQUEST_URL, LTI_JWKS_URI, LTI_CLIENT_ID (opcional).
 */
export function getLtiPlatformConfig(iss: string): LtiPlatformConfig | null {
  const configuredIssuer = process.env.LTI_ISSUER;
  if (!configuredIssuer || configuredIssuer !== iss) return null;
  const authRequestUrl = process.env.LTI_AUTH_REQUEST_URL;
  const jwksUri = process.env.LTI_JWKS_URI;
  if (!authRequestUrl || !jwksUri) return null;
  return {
    iss: configuredIssuer,
    auth_request_url: authRequestUrl,
    jwks_uri: jwksUri,
    client_id: process.env.LTI_CLIENT_ID || undefined,
  };
}

/**
 * Indica si LTI OIDC está configurado (al menos una plataforma).
 */
export function isLtiOidcConfigured(): boolean {
  return Boolean(
    process.env.LTI_ISSUER &&
    process.env.LTI_AUTH_REQUEST_URL &&
    process.env.LTI_JWKS_URI
  );
}

/**
 * URL de nuestro callback OIDC (donde la plataforma enviará el id_token).
 * Debe coincidir con la registrada en la plataforma.
 */
export function getLtiOidcCallbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  const host = base ? (base.startsWith('http') ? base : `https://${base}`) : '';
  return `${host}/api/lti/oidc/callback`;
}

/**
 * URL de nuestro login initiation (donde la plataforma redirige al usuario).
 */
export function getLtiOidcLoginUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  const host = base ? (base.startsWith('http') ? base : `https://${base}`) : '';
  return `${host}/api/lti/oidc/login`;
}

export { getSecret };
