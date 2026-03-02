/**
 * TT-105 / TT-106: LTI 1.3 — exportaciones.
 */

export { buildPlatformAuthRedirectUrl, verifyState, verifyLtiIdToken } from './oidc';
export {
  getLtiPlatformConfig,
  isLtiOidcConfigured,
  getLtiOidcCallbackUrl,
  getLtiOidcLoginUrl,
} from './config';
export { getCourseIdByResourceLinkId, getLaunchRedirectUrl } from './resource-link';
export type {
  LtiOidcLoginParams,
  LtiPlatformConfig,
  LtiIdTokenPayload,
  LtiOidcStatePayload,
} from './types';
