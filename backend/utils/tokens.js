const crypto = require('crypto');

/**
 * Generate a secure random hex token
 * @param {number} bytes - number of random bytes (default 32)
 * @returns {string} hex string token
 */
exports.generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token for safe storage in DB
 * @param {string} token
 * @returns {string} SHA-256 hash
 */
exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
