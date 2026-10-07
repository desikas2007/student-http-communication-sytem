import { ApiError, errorResponse } from '../utils/response.js';

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Returns 404 for any route that does not exist. */
export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

/**
 * Centralised error handler.
 * Produces the consistent error shape: { success:false, message, errorCode }
 * Stack traces are only exposed in development mode.
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let errors = err.errors;

  // Mongoose validation errors -> 400
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed. Please check the provided fields.';
  }

  // Mongoose cast errors (invalid ObjectId) -> 400
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_FORMAT';
    message = `Invalid value provided for '${err.path}': ${err.value}`;
  }

  // Duplicate unique index (register number / email) -> 409
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for: ${fields}. The record already exists.`;
  }

  // JWT errors -> 401
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Session expired. Please log in again.';
  }

  // Malformed JSON body -> 400
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Malformed JSON in request body.';
  }

  // Body too large -> 400
  if (err.type === 'entity.too.large') {
    statusCode = 400;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large.';
  }

  // Unexpected server-side failure -> 500 (never leak internals in production)
  if (statusCode >= 500 && !err.isOperational) {
    errorCode = 'INTERNAL_SERVER_ERROR';
    message =
      process.env.NODE_ENV === 'development'
        ? err.message || 'Internal Server Error'
        : 'Internal Server Error';
  }

  if (statusCode >= 500) {
    console.error(`[500] ${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  }

  const payload = {
    success: false,
    message,
    errorCode,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack.split('\n').slice(0, 6) } : {}),
  };

  res.status(statusCode).json(payload);
};

/** Convenience re-export so routes only import from one middleware module. */
export { errorResponse };
