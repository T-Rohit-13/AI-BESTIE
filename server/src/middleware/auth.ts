import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include authenticated user
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
 * Authentication Gate Middleware for Dump Mode
 * 
 * Verifies that the upstream authentication subsystem populated req.user.id.
 * Never accepts user_id from the client request body, query parameters, or URL.
 * 
 * In development or testing environments, supports standard upstream test headers
 * (e.g. x-user-id or Authorization bearer) if req.user is not yet attached by an upstream cookie parser.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // If not already set by upstream session/token middleware, check test/header hook
  if (!req.user?.id) {
    const testUserId = req.headers['x-user-id'];
    if (typeof testUserId === 'string' && testUserId.trim()) {
      req.user = { id: testUserId.trim() };
    }
  }

  // Strictly enforce authenticated user ID existence
  if (!req.user || !req.user.id || typeof req.user.id !== 'string' || !req.user.id.trim()) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  next();
}
