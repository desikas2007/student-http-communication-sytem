import { Router } from 'express';
import { query } from 'express-validator';
import { listExaminations, getExaminationById } from '../controllers/examController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * GET /api/exams  (HTTP GET - no request body, data is returned in the body)
 * 200 OK | 400 Bad Request | 401 Unauthorized
 */
router.get(
  '/',
  protect,
  validate([
    query('examType').optional().isString().trim().isLength({ max: 60 }),
    query('department').optional().isString().trim().isLength({ max: 40 }),
    query('year').optional().isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
    query('status').optional().isIn(['upcoming', 'completed']).withMessage('status must be upcoming or completed'),
  ]),
  listExaminations
);

/**
 * GET /api/exams/:id
 * 200 OK | 400 Bad Request | 401 Unauthorized | 404 Not Found
 */
router.get('/:id', protect, getExaminationById);

export default router;
