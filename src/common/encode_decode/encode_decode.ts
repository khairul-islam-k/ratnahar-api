import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCODE_DECODE_KEY;

  if (!keyHex || !/^[\da-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      'ENCODE_DECODE_KEY must be set to a 64-character hexadecimal (32-byte) key.',
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/** Encrypts JSON-serializable data. The result is a versioned, URL-safe string. */
export function encript(data: unknown): string {
  const serialized = JSON.stringify(data);

  if (serialized === undefined) {
    throw new TypeError('Data must be JSON-serializable.');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(serialized, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

/** Decrypts a value returned by encript and parses its original JSON value. */
export function decode<T = unknown>(encryptedData: string): T {
  const [version, ivEncoded, authTagEncoded, encryptedEncoded, ...extra] =
    encryptedData.split('.');

  if (
    version !== 'v1' ||
    !ivEncoded ||
    !authTagEncoded ||
    !encryptedEncoded ||
    extra.length > 0
  ) {
    throw new Error('Invalid encrypted data format.');
  }

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(authTagEncoded, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(decrypted) as T;
  } catch {
    throw new Error(
      'Could not decode encrypted data. Check the value and ENCODE_DECODE_KEY.',
    );
  }
}
