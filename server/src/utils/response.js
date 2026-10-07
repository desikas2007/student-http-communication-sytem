/**
 * Centralised response helpers.
 *
 * Success -> { success: true,  message, data }
 * Error   -> { success: false, message, errorCode, errors? }
 */

export class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'ERROR', errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, 'BAD_REQUEST', errors);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message = 'Resource already exists', errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}

/**
 * Sends a consistent success payload.
 * @param {import('express').Response} res
 * @param {{statusCode?: number, message?: string, data?: any, extra?: object}} options
 */
export const successResponse = (res, { statusCode = 200, message = 'Success', data = null, extra = {} }) =>
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
    ...extra,
  });

/**
 * Sends a consistent error payload.
 */
export const errorResponse = (res, statusCode, message, errorCode = 'ERROR', errors = undefined) =>
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(errors ? { errors } : {}),
  });
