// @ts-nocheck
// Password hashing and verification utilities
// Usa argon2 en el servidor y argon2-browser en el cliente

const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 19456; // KiB (~19 MB)
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;
const ARGON2_BROWSER_TYPE_ID = 2; // Argon2id

async function getBrowserArgon2() {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserArgon2 should only be called in the browser');
  }
  try {
    const module = await import('argon2-browser');
    return module.default;
  } catch (error) {
    console.error('Error loading argon2-browser:', error);
    throw error;
  }
}

async function getServerArgon2() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerArgon2 should only be called on the server');
  }
  const module = await import('argon2');
  return module;
}

function assertPassword(password: string) {
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required.');
  }
}

function getRandomSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function hashPassword(password: string): Promise<string> {
  assertPassword(password);

  if (typeof window !== 'undefined') {
    const argon2 = await getBrowserArgon2();
    const salt = getRandomSalt();
    const result = await argon2.hash({
      pass: password,
      salt,
      time: ARGON2_TIME_COST,
      mem: ARGON2_MEMORY_COST,
      hashLen: ARGON2_HASH_LENGTH,
      parallelism: ARGON2_PARALLELISM,
      type: ARGON2_BROWSER_TYPE_ID,
    });
    if (result.encoded) return result.encoded;
    throw new Error((result as { message?: string }).message ?? 'Argon2 hash failed');
  }

  const { hash, argon2id } = await getServerArgon2();
  return hash(password, {
    type: argon2id,
    timeCost: ARGON2_TIME_COST,
    memoryCost: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
    hashLength: ARGON2_HASH_LENGTH,
  });
}

export async function verifyPassword(password: string, encodedHash?: string): Promise<boolean> {
  if (!encodedHash) return false;
  assertPassword(password);

  if (typeof window !== 'undefined') {
    const argon2 = await getBrowserArgon2();
    try {
      await argon2.verify({ pass: password, encoded: encodedHash });
      return true;
    } catch {
      return false;
    }
  }

  const { verify } = await getServerArgon2();
  return verify(encodedHash, password);
}
