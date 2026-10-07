import jwt from 'jsonwebtoken';

/**
 * Signs a JWT for an authenticated student.
 * The secret is read from the environment - never hardcoded.
 */
export const generateToken = (studentId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Add it to server/.env');
  }
  return jwt.sign({ id: String(studentId) }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws a jsonwebtoken error on failure (handled by the error middleware).
 */
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
