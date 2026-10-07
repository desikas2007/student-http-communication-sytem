import mongoose from 'mongoose';
import HttpLog from '../models/HttpLog.js';
import { ApiError, successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { queryLogs, computeStatistics } from '../services/httpLogService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/http-logs
 * Query params: limit, page, method, statusCode, studentId, search, from, to
 * 200 -> paginated log list
 * 403 -> asking for another student's logs
 * 401 -> no/invalid JWT
 */
export const listLogs = asyncHandler(async (req, res) => {
  const { limit, page, method, statusCode, studentId, search, from, to } = req.query;

  // Authorisation demo (HTTP 403): a student may only read their own logs.
  if (studentId && studentId !== String(req.student._id)) {
    throw ApiError.forbidden(
      'You are not authorised to read HTTP logs belonging to another student.',
      'FORBIDDEN_RESOURCE'
    );
  }

  const filter = { studentId: req.student._id };

  if (method) filter.method = String(method).toUpperCase();
  if (statusCode) {
    const code = Number(statusCode);
    if (Number.isNaN(code)) {
      throw ApiError.badRequest('statusCode filter must be a number', [
        { field: 'statusCode', message: 'Expected a numeric HTTP status code' },
      ]);
    }
    filter.statusCode = code;
  }
  if (search) {
    filter.endpoint = { $regex: escapeRegex(String(search)), $options: 'i' };
  }
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const result = await queryLogs({ filter, page, limit });

  successResponse(res, {
    statusCode: 200,
    message: 'HTTP logs retrieved successfully',
    data: result,
  });
});

/**
 * GET /api/http-logs/statistics
 * 200 -> aggregated request statistics (must be declared before /:id)
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const statistics = await computeStatistics({ studentId: req.student._id });

  successResponse(res, {
    statusCode: 200,
    message: 'HTTP statistics retrieved successfully',
    data: { statistics },
  });
});

/**
 * GET /api/http-logs/:id
 * 200 -> single log, 400 -> malformed id, 404 -> not found
 */
export const getLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid log id: ${id}`, [
      { field: 'id', message: 'Log id must be a 24 character MongoDB ObjectId' },
    ]);
  }

  const log = await HttpLog.findById(id).lean();
  if (!log) throw ApiError.notFound(`HTTP log not found with id ${id}`, 'LOG_NOT_FOUND');

  if (String(log.studentId) !== String(req.student._id)) {
    throw ApiError.forbidden('You are not authorised to read this HTTP log.', 'FORBIDDEN_RESOURCE');
  }

  successResponse(res, {
    statusCode: 200,
    message: 'HTTP log retrieved successfully',
    data: { log },
  });
});
