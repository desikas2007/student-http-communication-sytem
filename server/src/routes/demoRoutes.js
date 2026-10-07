import { Router } from 'express';
import {
  simulateServerError,
  simulateDatabaseTimeout,
  simulateForbidden,
} from '../controllers/demoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/** GET /api/demo/server-error -> 500 Internal Server Error (test case TC11) */
router.get('/server-error', simulateServerError);

/** GET /api/demo/db-timeout -> 500 Internal Server Error */
router.get('/db-timeout', simulateDatabaseTimeout);

/** GET /api/demo/forbidden -> 403 Forbidden (authenticated but not authorised) */
router.get('/forbidden', protect, simulateForbidden);

export default router;
