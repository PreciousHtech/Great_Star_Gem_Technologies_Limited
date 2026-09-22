import crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function computeTotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotpToken(token: string, secretBase32: string): boolean {
  if (!token || !secretBase32) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  // Check current, previous, and next 30-sec windows to accommodate network or clock drift
  for (let offset = -1; offset <= 1; offset++) {
    const candidate = computeTotp(secretBase32, currentStep + offset);
    if (candidate === cleanToken) {
      return true;
    }
  }
  return false;
}

export interface TotpSetupResult {
  secret: string;
  uri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export async function generateTotpSetup(username: string): Promise<TotpSetupResult> {
  const rawBytes = crypto.randomBytes(20);
  const secret = base32Encode(rawBytes);
  const issuer = 'GreatStarGem Portfolio';
  const label = `${issuer}:${username}`;
  const uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(uri)}`;
  const backupCodes = generateBackupCodes(8);

  return {
    secret,
    uri,
    qrCodeUrl,
    backupCodes,
  };
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    const bytes = crypto.randomBytes(8);
    for (let b = 0; b < 4; b++) {
      part1 += chars[bytes[b] % chars.length];
      part2 += chars[bytes[b + 4] % chars.length];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export function verifyAndConsumeBackupCode(
  candidate: string,
  remainingCodes: string[]
): { isValid: boolean; remainingCodes: string[] } {
  if (!candidate || !Array.isArray(remainingCodes)) {
    return { isValid: false, remainingCodes };
  }

  const cleanCandidate = candidate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const matchIndex = remainingCodes.findIndex((c) => {
    const cleanCode = c.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleanCode === cleanCandidate;
  });

  if (matchIndex === -1) {
    return { isValid: false, remainingCodes };
  }

  const updated = [...remainingCodes];
  updated.splice(matchIndex, 1);
  return { isValid: true, remainingCodes: updated };
}
