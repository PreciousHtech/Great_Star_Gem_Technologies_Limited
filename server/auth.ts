import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';
const HASH_PREFIX = '$pbkdf2-sha512$';
const AUTH_CACHE_FILE = path.join(process.cwd(), '.admin-auth-cache.json');

export interface StoredAuthData {
  username: string;
  passwordHash: string;
  isCustomPassword: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  updatedAt?: string;
}

/**
 * Generates emergency recovery backup codes formatted as XXXX-XXXX
 */
export function generateBackupCodes(count: number = 6): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Generates a new TOTP secret, standard otpauth:// URI, and high-resolution QR code
 */
export async function generateTotpSetup(username: string = 'admin'): Promise<{
  secret: string;
  uri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  const secret = authenticator.generateSecret();
  const issuer = 'StarGem Technologies';
  const label = username || 'admin';
  const uri = authenticator.keyuri(`StarGem:${label}`, issuer, secret);

  const qrCodeUrl = await qrcode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: {
      dark: '#090d16',
      light: '#ffffff',
    },
  });

  const backupCodes = generateBackupCodes(6);

  return {
    secret,
    uri,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verifies a 6-digit TOTP token against a secret with +/- 1 time interval window tolerance.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  try {
    return authenticator.check(cleanToken, secret);
  } catch {
    return false;
  }
}

/**
 * Verifies and burns a one-time emergency backup code
 */
export function verifyAndConsumeBackupCode(
  candidateCode: string,
  storedCodes: string[]
): { isValid: boolean; remainingCodes: string[] } {
  if (!candidateCode || !storedCodes || !Array.isArray(storedCodes)) {
    return { isValid: false, remainingCodes: storedCodes || [] };
  }

  const normalizedCandidate = candidateCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const index = storedCodes.findIndex((code) => {
    const normalizedStored = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return normalizedCandidate === normalizedStored;
  });

  if (index !== -1) {
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);
    return { isValid: true, remainingCodes };
  }

  return { isValid: false, remainingCodes: storedCodes };
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
        twoFactorEnabled: Boolean(parsed.twoFactorEnabled),
        twoFactorSecret: parsed.twoFactorSecret,
        twoFactorBackupCodes: parsed.twoFactorBackupCodes,
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (err) {
    console.warn('Failed to read auth cache file:', err);
  }
  return { username: 'admin', passwordHash: '', isCustomPassword: false, twoFactorEnabled: false };
}

/**
 * Writes the securely hashed password and 2FA settings to the local auth cache.
 * Plain-text passwords are NEVER written to this file.
 */
export function writeAuthCache(data: StoredAuthData): void {
  try {
    const existing = readAuthCache();
    const cleanData: StoredAuthData = {
      username: data.username || existing.username,
      passwordHash: data.passwordHash || existing.passwordHash,
      isCustomPassword: data.isCustomPassword !== undefined ? data.isCustomPassword : existing.isCustomPassword,
      twoFactorEnabled: data.twoFactorEnabled !== undefined ? data.twoFactorEnabled : existing.twoFactorEnabled,
      twoFactorSecret: data.twoFactorSecret !== undefined ? data.twoFactorSecret : existing.twoFactorSecret,
      twoFactorBackupCodes: data.twoFactorBackupCodes !== undefined ? data.twoFactorBackupCodes : existing.twoFactorBackupCodes,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_CACHE_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write auth cache file:', err);
  }
}
