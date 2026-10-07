import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, submitInformation, updateInformation } from '../controllers/studentController.js';
import { validate, validateDynamic } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Validation rules grouped per field so that
 *  - POST /information can require *every* field (incomplete -> 400), and
 *  - PUT  /information can validate only the fields that were supplied.
 */
const rulesByField = {
  name: [
    body('name')
      .exists()
      .withMessage('Full name is required')
      .bail()
      .trim()
      .isLength({ min: 3, max: 80 })
      .withMessage('Full name must be between 3 and 80 characters'),
  ],
  registerNumber: [
    body('registerNumber')
      .exists()
      .withMessage('Register number is required')
      .bail()
      .trim()
      .matches(/^[A-Za-z0-9/-]{4,24}$/)
      .withMessage('Register number must be 4-24 letters or digits (e.g. 23CSE101)'),
  ],
  email: [
    body('email')
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Enter a valid email address')
      .bail()
      .trim()
      .isLength({ max: 120 })
      .withMessage('Email must be 120 characters or fewer'),
  ],
  department: [
    body('department')
      .exists()
      .withMessage('Department is required')
      .bail()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Department must be between 2 and 80 characters'),
  ],
  year: [
    body('year')
      .exists()
      .withMessage('Year is required')
      .bail()
      .isInt({ min: 1, max: 5 })
      .withMessage('Year must be a number between 1 and 5')
      .toInt(),
  ],
  section: [
    body('section')
      .exists()
      .withMessage('Section is required')
      .bail()
      .trim()
      .matches(/^[A-Za-z]{1,3}$/)
      .withMessage('Section must be 1-3 letters (e.g. A)'),
  ],
  phone: [
    body('phone')
      .exists()
      .withMessage('Phone number is required')
      .bail()
      .trim()
      .matches(/^[0-9+-\s]{7,15}$/)
      .withMessage('Phone number must be 7-15 digits'),
  ],
};

const allRules = Object.values(rulesByField).flat();

/** GET /api/students/profile -> 200 OK | 401 Unauthorized */
router.get('/profile', protect, getProfile);

/**
 * POST /api/students/information -> 201 Created | 400 | 401 | 409 Conflict
 * Every field is mandatory - a partial payload fails with 400 (TC06).
 */
router.post('/information', protect, validate(allRules), submitInformation);

/**
 * PUT /api/students/information -> 200 OK | 400 | 401 | 409 Conflict
 * Only the supplied fields are validated (partial update).
 */
router.put(
  '/information',
  protect,
  validateDynamic((req) =>
    Object.entries(rulesByField)
      .filter(([field]) => req.body && req.body[field] !== undefined)
      .flatMap(([, fieldRules]) => fieldRules)
  ),
  updateInformation
);

export default router;
