// INARO — Global Error Handling Middleware (Team Member 1 Scope)
// Catches all unhandled errors and returns standardised JSON: { success: false, message }
// This must be registered LAST in the Express middleware chain (after all routes).

const { sendError } = require('../utils/response');

/**
 * Global error handler — Express 4-argument error middleware.
 */
const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[GlobalErrorHandler]', {
    message: err.message,
    stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path:    req.path,
    method:  req.method,
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 422, messages[0] || 'Validation error');
  }

  // Mongoose duplicate key (unique constraint violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, 409, `A user with this ${field} already exists`);
  }

  // JWT errors (should normally be caught in middleware, but belt-and-suspenders)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Invalid or expired token');
  }

  // Generic fallback — never expose stack in production
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  return sendError(res, statusCode, message);
};

/**
 * 404 Not Found handler — register before globalErrorHandler but after all routes.
 */
const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
};

module.exports = { globalErrorHandler, notFoundHandler };
