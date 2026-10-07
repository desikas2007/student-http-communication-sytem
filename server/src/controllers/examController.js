import Examination from '../models/Examination.js';
import { ApiError, successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * GET /api/exams
 * Retrieves examinations for the authenticated student.
 * Supports optional filters: ?examType=, ?department=, ?year=, ?status=upcoming|completed
 * 200 -> list returned
 */
export const listExaminations = asyncHandler(async (req, res) => {
  const { examType, department, year, status } = req.query;

  const filter = {};
  if (examType && examType !== 'All') filter.examType = examType;
  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (status === 'upcoming') filter.date = { $gte: new Date() };
  if (status === 'completed') filter.date = { $lt: new Date() };

  const examinations = await Examination.find(filter).sort({ date: 1, startTime: 1 }).lean();

  successResponse(res, {
    statusCode: 200,
    message: 'Examinations retrieved successfully',
    data: { count: examinations.length, examinations },
  });
});

/**
 * GET /api/exams/:id
 * 200 -> found, 400 -> malformed id, 404 -> no such examination
 */
export const getExaminationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw ApiError.badRequest(`Invalid examination id: ${id}`, [
      { field: 'id', message: 'Examination id must be a 24 character MongoDB ObjectId' },
    ]);
  }

  const examination = await Examination.findById(id).lean();
  if (!examination) {
    throw ApiError.notFound(`Examination not found with id ${id}`, 'EXAM_NOT_FOUND');
  }

  successResponse(res, {
    statusCode: 200,
    message: 'Examination retrieved successfully',
    data: { examination },
  });
});
