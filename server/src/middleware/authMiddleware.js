import Student from '../models/Student.js';
import { ApiError } from '../utils/response.js';
import { asyncHandler } from './errorMiddleware.js';
import { verifyToken } from '../utils/generateToken.js';

/**
 * Protects routes with JWT authentication.
 * Expects:  Authorization: Bearer <token>
 * Attaches the authenticated student to req.student.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized(
      'Authentication required. Send the token as: Authorization: Bearer <token>',
      'UNAUTHORIZED'
    );
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized(
      'Malformed Authorization header. Use the "Bearer <token>" scheme.',
      'INVALID_AUTH_SCHEME'
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing.', 'TOKEN_MISSING');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid authentication token.', 'INVALID_TOKEN');
  }

  const student = await Student.findById(decoded.id);
  if (!student) {
    throw ApiError.unauthorized('Account not found. Please log in again.', 'ACCOUNT_NOT_FOUND');
  }

  req.student = student;
  next();
});
