import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY_LENGTH = 32;

/**
 * Get the encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.GEMINI_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error('GEMINI_KEY_ENCRYPTION_SECRET is not set in environment variables');
  }

  // Convert hex string to buffer
  const key = Buffer.from(secret, 'hex');

  if (key.length !== ENCRYPTION_KEY_LENGTH) {
    throw new Error(`Encryption key must be ${ENCRYPTION_KEY_LENGTH} bytes`);
  }

  return key;
}

/**
 * Encrypt an API key using AES-256-GCM
 * Returns a string in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an API key that was encrypted with encryptApiKey
 * Expects a string in format: iv:authTag:encryptedData (all hex encoded)
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
