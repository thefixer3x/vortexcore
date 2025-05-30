/**
 * Simple encryption/decryption utilities for sensitive data
 * Uses AES encryption with a key derived from the user ID
 */
import CryptoJS from 'crypto-js';

/**
 * Encrypts a string using AES with a key derived from the user ID
 * @param text Text to encrypt
 * @param userId User ID to use as encryption key seed
 * @returns Encrypted string
 */
export const encrypt = (text: string, userId: string): string => {
  // Create a deterministic but secure key from user ID
  const key = CryptoJS.PBKDF2(userId, 'vortex-salt', { 
    keySize: 256 / 32,
    iterations: 1000
  }).toString();

  // Encrypt the text
  return CryptoJS.AES.encrypt(text, key).toString();
};

/**
 * Decrypts a string that was encrypted with the encrypt function
 * @param encryptedText Encrypted text
 * @param userId User ID used for encryption
 * @returns Decrypted string
 */
export const decrypt = (encryptedText: string, userId: string): string => {
  try {
    // Recreate the same key
    const key = CryptoJS.PBKDF2(userId, 'vortex-salt', { 
      keySize: 256 / 32, 
      iterations: 1000
    }).toString();

    // Decrypt the text
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return '[Encrypted content]';
  }
};
