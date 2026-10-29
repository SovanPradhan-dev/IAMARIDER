/**
 * Wraps an async Express route handler so rejected promises are forwarded
 * to next(err) and handled by the centralized error handler.
 * Without this, Express 4 leaves async handler rejections unhandled and the
 * client hangs waiting for a response.
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
