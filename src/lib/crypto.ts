/**
 * Utility for RSA cryptography using the Web Crypto API.
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeys {
  publicKey: string;
  privateKey: string;
}

/**
 * Generates an RSA-OAEP key pair for encryption/decryption
 * and an RSASSA-PKCS1-v1_5 key pair for signing/verification.
 * For simplicity in this demo, we'll generate one of each if requested.
 */
export async function generateRSAKeyPair(modulusLength: 2048 | 4096 = 2048): Promise<KeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

export async function generateSigningKeyPair(modulusLength: 2048 | 4096 = 2048): Promise<KeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
}

/**
 * Encrypts a message using a public key.
 */
export async function encryptMessage(publicKey: CryptoKey, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  );
}

/**
 * Decrypts a message using a private key.
 */
export async function decryptMessage(privateKey: CryptoKey, ciphertext: ArrayBuffer): Promise<string> {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Signs a message using a private key (RSA-256 signature).
 */
export async function signMessage(privateKey: CryptoKey, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await window.crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    privateKey,
    data
  );
}

/**
 * Verifies a signature using a public key.
 */
export async function verifySignature(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  message: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await window.crypto.subtle.verify(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    publicKey,
    signature,
    data
  );
}

/**
 * Helper to convert ArrayBuffer to Base64.
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper to convert Base64 to ArrayBuffer.
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Export keys to SPKI (public) and PKCS8 (private) formats as Base64 strings.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const format = key.type === "public" ? "spki" : "pkcs8";
  const exported = await window.crypto.subtle.exportKey(format, key);
  return bufferToBase64(exported);
}
