import crypto from 'crypto';

/**
 * Generates a cryptographically secure random verification token (at least 256 bits = 32 bytes)
 * @param {number} [bytes=32]
 * @returns {string} Hex-encoded unique token
 */
export const generateVerificationToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Computes the SHA-256 hash of a verification token
 * Only the hash is stored in MongoDB; the raw token is never persisted
 * @param {string} token - Raw verification token
 * @returns {string} SHA-256 hex digest
 */
export const hashToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
};

export default {
  generateVerificationToken,
  hashToken
};
