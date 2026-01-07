/**
 * Crypto service for encrypting/decrypting sensitive data using AES-256-GCM
 * Uses Web Crypto API for browser compatibility
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 128; // bits

/**
 * Gets the encryption key from environment variables
 * Key should be a 32-byte hex string (64 characters)
 */
function getEncryptionKey(): string {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("VITE_ENCRYPTION_KEY environment variable is not set");
  }
  if (key.length !== 64) {
    throw new Error(
      "VITE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  return key;
}

/**
 * Converts a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Converts base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Imports the encryption key for use with Web Crypto API
 */
async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Uses VITE_ENCRYPTION_KEY from environment
 * Returns format: iv:authTag:ciphertext (base64 encoded)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const keyHex = getEncryptionKey();
  const key = await importKey(keyHex);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt
  const ciphertextWithTag = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: AUTH_TAG_LENGTH,
    },
    key,
    plaintextBytes
  );

  // Web Crypto API appends auth tag to ciphertext
  // Split them for our format
  const ciphertextWithTagArray = new Uint8Array(ciphertextWithTag);
  const authTagStart = ciphertextWithTagArray.length - AUTH_TAG_LENGTH / 8;
  const ciphertext = ciphertextWithTagArray.slice(0, authTagStart);
  const authTag = ciphertextWithTagArray.slice(authTagStart);

  // Format: iv:authTag:ciphertext (all base64 encoded)
  return `${bytesToBase64(iv)}:${bytesToBase64(authTag)}:${bytesToBase64(
    ciphertext
  )}`;
}

/**
 * Decrypts a ciphertext string encrypted with encrypt()
 * Returns the original plaintext
 */
export async function decrypt(encryptedData: string): Promise<string> {
  const keyHex = getEncryptionKey();
  const key = await importKey(keyHex);

  // Parse the format: iv:authTag:ciphertext
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  const iv = base64ToBytes(ivBase64);
  const authTag = base64ToBytes(authTagBase64);
  const ciphertext = base64ToBytes(ciphertextBase64);

  // Web Crypto API expects auth tag appended to ciphertext
  const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(authTag, ciphertext.length);

  // Decrypt
  const plaintextBytes = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: AUTH_TAG_LENGTH,
    },
    key,
    ciphertextWithTag
  );

  // Decode bytes to string
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}
