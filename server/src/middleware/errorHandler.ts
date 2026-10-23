import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Global Error Handler Middleware
 * Guarantees that internal database errors, encryption details, stack traces,
 * or user dump texts are never exposed in API responses.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle invalid JSON body syntax
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  // Handle explicit application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Log error internally in non-production without leaking sensitive user text
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error('[Internal Error]:', err?.message || err);
  }

  // Generic production-safe 500 response
  res.status(500).json({ error: 'Internal server error' });
}
