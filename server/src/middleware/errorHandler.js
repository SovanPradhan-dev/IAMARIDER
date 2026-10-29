/**
 * Centralized error handler.
 * Production responses never leak stack traces or internal details.
 */
export const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error('[ERROR]', new Date().toISOString(), status, message, err.stack || '');

  if (process.env.NODE_ENV === 'production') {
    return res.status(status).json({
      error: status === 500 ? 'Internal server error' : message,
    });
  }

  return res.status(status).json({
    error: message,
    stack: err.stack,
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
