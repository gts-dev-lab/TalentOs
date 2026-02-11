/**
 * TT-105: Tipos para LTI 1.3 OIDC.
 * Referencia: IMS LTI 1.3 Core, OIDC third-party login.
 */

/** Parámetros de la petición de inicio de login OIDC (platform → tool). */
export type LtiOidcLoginParams = {
  iss: string;
  login_hint: string;
  target_link_uri: string;
  client_id: string;
  lti_message_hint?: string;
  lti_deployment_id?: string;
};

/** Configuración de una plataforma LTI (issuer). */
export type LtiPlatformConfig = {
  iss: string;
  /** URL del endpoint de autorización de la plataforma (donde redirigir al usuario). */
  auth_request_url: string;
  /** URL del JWKS de la plataforma para verificar el id_token. */
  jwks_uri: string;
  /** client_id que la plataforma asigna a esta herramienta (opcional para validación). */
  client_id?: string;
};

/** Payload del id_token JWT devuelto por la plataforma (claims LTI 1.3). */
export type LtiIdTokenPayload = {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/version'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link'?: { id: string };
  [key: string]: unknown;
};

/** Estado firmado que enviamos a la plataforma y recuperamos en el callback. */
export type LtiOidcStatePayload = {
  nonce: string;
  target_link_uri: string;
  iss: string;
  login_hint: string;
  lti_message_hint?: string;
  iat: number;
};
