import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';
const HASH_PREFIX = '$pbkdf2-sha512$';
const AUTH_CACHE_FILE = path.join(process.cwd(), '.admin-auth-cache.json');

export interface StoredAuthData {
  username: string;
  passwordHash: string;
  isCustomPassword: boolean;
  updatedAt?: string;
}

/**
 * Computes a cryptographically secure, salted one-way hash of the plain-text password.
 * Format: $pbkdf2-sha512$100000$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(plainText, salt, ITERATIONS, KEYLEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${HASH_PREFIX}${ITERATIONS}$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Checks whether a string is already a cryptographically secure salted hash.
 */
export function isHashedPassword(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith(HASH_PREFIX);
}

/**
 * Cryptographically verifies a plain text candidate password against the stored password hash.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * Supports legacy plain-text comparison for backward-compatibility during one-time automatic migration.
 */
export async function verifyPassword(
  candidatePlain: string,
  storedHashOrPlain: string | null | undefined
): Promise<boolean> {
  if (!candidatePlain || !storedHashOrPlain) {
    return false;
  }

  // 1. Standard: verify against salted PBKDF2 hash
  if (storedHashOrPlain.startsWith(HASH_PREFIX)) {
    const parts = storedHashOrPlain.split('$');
    // Expected format: ["", "pbkdf2-sha512", "100000", "<salt>", "<hash>"]
    if (parts.length === 5) {
      const iterations = parseInt(parts[2], 10) || ITERATIONS;
      const salt = parts[3];
      const expectedHashHex = parts[4];

      return new Promise((resolve) => {
        crypto.pbkdf2(candidatePlain, salt, iterations, KEYLEN, DIGEST, (err, derivedKey) => {
          if (err) return resolve(false);
          try {
            const expectedBuf = Buffer.from(expectedHashHex, 'hex');
            if (derivedKey.length !== expectedBuf.length) {
              return resolve(false);
            }
            resolve(crypto.timingSafeEqual(derivedKey, expectedBuf));
          } catch {
            resolve(false);
          }
        });
      });
    }
  }

  // 2. Legacy Plain-Text fallback (timing-safe comparison for pre-existing records)
  try {
    const candidateBuf = Buffer.from(candidatePlain, 'utf8');
    const storedBuf = Buffer.from(storedHashOrPlain, 'utf8');
    if (candidateBuf.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuf, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Reads local auth cache securely. The cache ONLY stores hashed credentials.
 */
export function readAuthCache(): StoredAuthData {
  try {
    if (fs.existsSync(AUTH_CACHE_FILE)) {
      const raw = fs.readFileSync(AUTH_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Support migration if cache previously stored plain 'password' key
      const hash = parsed.passwordHash || parsed.password || '';
      return {
        username: parsed.username || 'admin',
        passwordHash: hash,
        isCustomPassword: Boolean(parsed.isCustomPassword),
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (err) {
    console.warn('Failed to read auth cache file:', err);
  }
  return { username: 'admin', passwordHash: '', isCustomPassword: false };
}

/**
 * Writes the securely hashed password to the local auth cache.
 * Plain-text passwords are NEVER written to this file.
 */
export function writeAuthCache(data: StoredAuthData): void {
  try {
    const existing = readAuthCache();
    const cleanData: StoredAuthData = {
      username: data.username || existing.username,
      passwordHash: data.passwordHash || existing.passwordHash,
      isCustomPassword: data.isCustomPassword !== undefined ? data.isCustomPassword : existing.isCustomPassword,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_CACHE_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write auth cache file:', err);
  }
}
