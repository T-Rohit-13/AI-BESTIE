// INARO — JWT Authentication Middleware (Team Member 1 Scope)
// Protects routes that require a valid session. Verifies tokenVersion to
// support instant session revocation on password reset (aligned with Prisma schema).
const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const User = require('../models/User');

/**
 * authenticate — Express middleware to guard protected routes.
 *
 * Reads the Bearer token from the Authorization header, verifies it,
 * then confirms the embedded tokenVersion still matches the DB record.
 * On success, attaches the full user document (without passwordHash) to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let payload;

    try {
      payload = verifyToken(token);
    } catch (jwtErr) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      return sendError(res, 401, isExpired ? 'Session expired. Please log in again.' : 'Invalid authentication token');
    }

    // Fetch user and validate tokenVersion for revocation support
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) {
      return sendError(res, 401, 'User account not found');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return sendError(res, 401, 'Session has been revoked. Please log in again.');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Unexpected error:', err);
    return sendError(res, 500, 'An internal error occurred during authentication');
  }
};

module.exports = { authenticate };
