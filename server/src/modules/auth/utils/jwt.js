// INARO — JWT Utility (Team Member 1 Scope)
// Issues and verifies JSON Web Tokens for auth and temporary OTP-verification tokens.
const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET  || 'inaro_dev_jwt_secret_CHANGE_IN_PROD_min32chars';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Issues a signed JWT auth token for an authenticated user.
 * Embeds tokenVersion so that password-reset invalidation works:
 * the middleware rejects tokens whose tokenVersion does not match the DB.
 *
 * @param {{ id: string, username: string, tokenVersion: number }} user
 * @returns {string} Signed JWT
 */
const signAuthToken = (user) => {
  return jwt.sign(
    {
      sub:          user._id || user.id,
      username:     user.username,
      tokenVersion: user.tokenVersion,
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
};

/**
 * Issues a short-lived token confirming that a specific mobile number has
 * passed OTP verification. Used to gate the /register endpoint.
 *
 * @param {string} mobile
 * @param {string} purpose - 'REGISTRATION' | 'PASSWORD_RESET'
 * @returns {string} Signed verification token (10 minutes)
 */
const signVerificationToken = (mobile, purpose) => {
  return jwt.sign(
    { mobile, purpose, verified: true },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
};

/**
 * Verifies any JWT produced by this service.
 * Throws a jwt.JsonWebTokenError or jwt.TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { signAuthToken, signVerificationToken, verifyToken };
