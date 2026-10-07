import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/auth/register  (HTTP POST - the new account is written to MongoDB)
 * 201 Created | 400 Bad Request | 409 Conflict | 429 Too Many Requests
 */
router.post(
  '/register',
  registerLimiter,
  validate([
    body('name')
      .exists()
      .withMessage('Name is required')
      .bail()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters'),
    body('registerNumber')
      .exists()
      .withMessage('Register number is required')
      .bail()
      .trim()
      .matches(/^[A-Za-z0-9]{4,24}$/)
      .withMessage('Register number must be 4-24 letters or digits')
      .toUpperCase(),
    body('email')
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Enter a valid email address')
      .trim()
      .isLength({ max: 120 })
      .withMessage('Email must be 120 characters or fewer')
      .toLowerCase(),
    body('password')
      .exists()
      .withMessage('Password is required')
      .bail()
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters'),
    body('department')
      .exists()
      .withMessage('Department is required')
      .bail()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Department must be between 2 and 80 characters'),
    body('year')
      .exists()
      .withMessage('Year is required')
      .bail()
      .isInt({ min: 1, max: 5 })
      .withMessage('Year must be between 1 and 5')
      .toInt(),
    body('section')
      .exists()
      .withMessage('Section is required')
      .bail()
      .trim()
      .matches(/^[A-Za-z0-9]{1,4}$/)
      .withMessage('Section must be 1-4 letters or digits')
      .toUpperCase(),
    body('phone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[0-9]{7,15}$/)
      .withMessage('Phone must be 7-15 digits'),
  ]),
  register
);

/**
 * POST /api/auth/login  (HTTP POST - credentials travel in the request body)
 * 200 OK | 400 Bad Request | 401 Unauthorized | 429 Too Many Requests
 */
router.post(
  '/login',
  loginLimiter,
  validate([
    body('email')
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Enter a valid email address')
      .trim()
      .isLength({ max: 120 })
      .withMessage('Email must be 120 characters or fewer'),
    body('password')
      .exists()
      .withMessage('Password is required')
      .bail()
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters'),
  ]),
  login
);

/**
 * GET /api/auth/me  (HTTP GET - token sent in the Authorization header)
 * 200 OK | 401 Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/logout
 * 200 OK
 */
router.post('/logout', logout);

export default router;
