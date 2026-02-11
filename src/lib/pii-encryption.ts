/**
 * TT-104: Cifrado de datos PII en reposo.
 * Catálogo de campos PII y helpers que usan AES (configurable a AES-256 con ENCRYPTION_SECRET ≥32 bytes).
 * Uso previsto: servidor (API Routes, scripts de migración). En producción, ENCRYPTION_SECRET
 * debe provenir de un Key Vault (ver docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md).
 */

import { encryptString, decryptString, isEncryptionConfigured } from '@/lib/auth/encryption';

/** Claves del catálogo de campos PII (entidad.campo) para trazabilidad y futura rotación por campo */
export const PII_FIELD_KEYS = {
  user_name: 'user.name',
  user_email: 'user.email',
  user_phone: 'user.phone',
  /** Otros PII que se añadan (ej. instructor en cursos, nombres en notificaciones) */
} as const;

export type PiiFieldKey = (typeof PII_FIELD_KEYS)[keyof typeof PII_FIELD_KEYS];

/** Lista de todas las claves PII (para iteración o validación) */
export const ALL_PII_FIELDS: PiiFieldKey[] = Object.values(PII_FIELD_KEYS);

/**
 * Cifra un valor PII en texto plano.
 * Usa la misma clave que auth/encryption (ENCRYPTION_SECRET). Para AES-256, usar secreto ≥32 caracteres.
 * @param plainText Valor a cifrar (ej. email, nombre, teléfono)
 * @param fieldKey Opcional: clave del catálogo PII para auditoría o rotación futura
 * @returns Texto cifrado (base64-like); lanza si falta ENCRYPTION_SECRET
 */
export function encryptPii(plainText: string, fieldKey?: PiiFieldKey): string {
  if (!plainText) return '';
  return encryptString(plainText);
}

/**
 * Descifra un valor PII previamente cifrado con encryptPii.
 * @param cipherText Valor cifrado
 * @param fieldKey Opcional: clave del catálogo (sin efecto en el descifrado actual)
 * @returns Texto en claro; lanza si falla el descifrado o falta clave
 */
export function decryptPii(cipherText: string, fieldKey?: PiiFieldKey): string {
  if (!cipherText) return '';
  return decryptString(cipherText);
}

/**
 * Indica si el cifrado está configurado (ENCRYPTION_SECRET definido).
 * Útil para decidir si persistir PII cifrado o en claro en entornos de desarrollo.
 */
export function isPiiEncryptionAvailable(): boolean {
  return isEncryptionConfigured();
}
