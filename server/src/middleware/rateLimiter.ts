import rateLimit from 'express-rate-limit';

/**
 * Write Operation Rate Limiter for Dump Mode
 * Protects entry creation, renaming, and deletion from abuse while
 * allowing comfortable interactive journaling for teenage & college users.
 */
export const dumpWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'test' ? 10000 : 60, // 60 write actions per minute
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too many requests, please try again later',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests
});
