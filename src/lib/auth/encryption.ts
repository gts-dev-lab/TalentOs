import CryptoJS from 'crypto-js';

function getEncryptionKey(explicitKey?: string): string {
  const key = explicitKey || process.env.ENCRYPTION_SECRET;
  if (!key) {
    throw new Error('Missing ENCRYPTION_SECRET environment variable.');
  }
  return key;
}

export function encryptString(plainText: string, key?: string): string {
  const secret = getEncryptionKey(key);
  return CryptoJS.AES.encrypt(plainText, secret).toString();
}

export function decryptString(cipherText: string, key?: string): string {
  const secret = getEncryptionKey(key);
  const bytes = CryptoJS.AES.decrypt(cipherText, secret);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) {
    throw new Error('Failed to decrypt payload.');
  }
  return decrypted;
}

export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.ENCRYPTION_SECRET);
}
