import mongoose from 'mongoose';
import { ApiError } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * GET /api/demo/server-error
 * Deliberately simulates a MongoDB driver failure so that students can
 * demonstrate HTTP 500 Internal Server Error (test case TC11) without
 * breaking the rest of the application.
 */
export const simulateServerError = asyncHandler(async (_req, _res) => {
  throw new ApiError(
    500,
    'Simulated MongoDB failure: connection to the database was interrupted (demo endpoint).',
    'SIMULATED_SERVER_ERROR'
  );
});

/**
 * GET /api/demo/db-timeout
 * Emulates a slow/broken database round trip that resolves into a 500.
 */
export const simulateDatabaseTimeout = asyncHandler(async (_req, _res) => {
  // Simulate the driver timing out instead of touching the real database.
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(500, 'Database is unavailable (simulated).', 'DATABASE_UNAVAILABLE');
  }
  throw new ApiError(500, 'Simulated query timeout on the examinations collection.', 'SIMULATED_QUERY_TIMEOUT');
});

/**
 * GET /api/demo/forbidden
 * Emulates an authenticated user accessing a resource they may not read (403).
 */
export const simulateForbidden = asyncHandler(async () => {
  throw ApiError.forbidden(
    'Authenticated, but this resource belongs to another student (demo endpoint).',
    'FORBIDDEN_RESOURCE'
  );
});
