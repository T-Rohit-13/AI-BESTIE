import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for INARO Dump Mode Write Endpoints
 *
 * Scoped to write endpoints:
 * - POST /dump/entries
 * - PUT /dump/space-name
 * - DELETE /dump/entries
 * - DELETE /dump/entries/:id
 *
 * Returns 429 Too Many Requests with JSON error:
 * { "error": "Too many requests, please try again later." }
 */
export const dumpWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 write requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip during test runs
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
});
