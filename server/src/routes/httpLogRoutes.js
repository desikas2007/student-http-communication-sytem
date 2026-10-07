import { Router } from 'express';
import { query } from 'express-validator';
import { listLogs, getStatistics, getLogById } from '../controllers/httpLogController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Every monitoring route requires a valid JWT.
router.use(protect);

/**
 * GET /api/http-logs/statistics
 * Declared before /:id so "statistics" is not captured as an id.
 * 200 OK | 401 Unauthorized
 */
router.get(
  '/statistics',
  validate([query('limit').optional().isInt({ min: 1, max: 200 })]),
  getStatistics
);

/**
 * GET /api/http-logs
 * 200 OK | 400 Bad Request | 401 Unauthorized | 403 Forbidden
 */
router.get(
  '/',
  validate([
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
    query('method').optional().isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    query('statusCode').optional().isInt({ min: 100, max: 599 }),
  ]),
  listLogs
);

/** GET /api/http-logs/:id -> 200 OK | 400 | 401 | 403 | 404 Not Found */
router.get('/:id', getLogById);

export default router;
