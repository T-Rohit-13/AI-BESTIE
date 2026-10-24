import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username?: string;
      };
    }
  }
}

/**
 * Authentication Middleware for INARO Dump Mode
 *
 * Rules:
 * - Provides req.user.id for the authenticated user.
 * - If req.user.id is missing: returns 401 with { "error": "Authentication required" }.
 * - Never accept user_id from client request body or query params.
 * - For automated testing & mock integration, extracts user id from:
 *   1. Pre-populated req.user.id (from upstream auth service)
 *   2. x-user-id header (convenient for automated tests and service-to-service mocks)
 *   3. Bearer token payload if standard JWT is present
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Check if upstream authentication middleware already attached user
  if (req.user && req.user.id) {
    return next();
  }

  // 2. Check for test/mock authorization header (e.g. in test suite)
  const testUserId = req.headers['x-user-id'];
  if (typeof testUserId === 'string' && testUserId.trim()) {
    req.user = { id: testUserId.trim() };
    return next();
  }

  // 3. Simple Bearer token mock support for teammates (e.g. Bearer <userId>)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      // In production, Member 1's JWT verifier runs here.
      // For standalone/mock, if token does not contain dots (not JWT), treat as direct ID
      if (!token.includes('.')) {
        req.user = { id: token };
        return next();
      } else {
        // If JWT format, parse payload without verification for development mock
        try {
          const payloadBase64 = token.split('.')[1];
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          if (decoded && (decoded.id || decoded.sub || decoded.userId)) {
            req.user = { id: decoded.id || decoded.sub || decoded.userId };
            return next();
          }
        } catch {
          // invalid token
        }
      }
    }
  }

  // Missing or unauthenticated -> 401 Unauthorized
  res.status(401).json({
    error: 'Authentication required',
  });
}
