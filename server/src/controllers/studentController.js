import Student from '../models/Student.js';
import { ApiError, successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const isDuplicate = (candidate, currentId) =>
  candidate && String(candidate._id) !== String(currentId);

/** Fields a student may submit through the Student Information form. */
const SUBMITTABLE_FIELDS = [
  'name',
  'registerNumber',
  'email',
  'department',
  'year',
  'section',
  'phone',
];

const pickSubmittedFields = (body) =>
  SUBMITTABLE_FIELDS.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});

/**
 * Rejects submissions that reuse another student's register number or email.
 * Throws HTTP 409 Conflict (test case TC07).
 */
const assertNoDuplicate = async (fields, currentId) => {
  const orClauses = [];
  if (fields.registerNumber) orClauses.push({ registerNumber: fields.registerNumber });
  if (fields.email) orClauses.push({ email: String(fields.email).toLowerCase() });

  if (!orClauses.length) return;

  const duplicate = await Student.findOne({
    $or: orClauses,
    _id: { $ne: currentId },
  }).select('registerNumber email');

  if (duplicate) {
    const field =
      duplicate.registerNumber && fields.registerNumber === duplicate.registerNumber
        ? 'registerNumber'
        : 'email';
    throw ApiError.conflict(
      `Duplicate ${field === 'registerNumber' ? 'register number' : 'email'}: "${fields[field]}" already belongs to another student.`,
      'DUPLICATE_STUDENT'
    );
  }
};

/**
 * GET /api/students/profile
 * 200 -> the authenticated student's profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  successResponse(res, {
    statusCode: 200,
    message: 'Profile retrieved successfully',
    data: { student: req.student.toPublic() },
  });
});

/**
 * POST /api/students/information
 * Creates/records a student information submission.
 * 201 -> created, 400 -> incomplete/invalid data, 409 -> duplicate register number
 */
export const submitInformation = asyncHandler(async (req, res) => {
  const fields = pickSubmittedFields(req.body);
  const student = req.student;

  await assertNoDuplicate(fields, student._id);

  SUBMITTABLE_FIELDS.forEach((field) => {
    if (fields[field] !== undefined) student[field] = fields[field];
  });

  // First submission records when the student published their information.
  if (!student.informationSubmitted) {
    student.informationSubmitted = true;
    student.submittedAt = new Date();
  } else {
    student.submittedAt = new Date();
  }

  await student.save();

  successResponse(res, {
    statusCode: 201,
    message: 'Student information submitted successfully',
    data: { student: student.toPublic() },
  });
});

/**
 * PUT /api/students/information
 * Updates an existing student information submission.
 * 200 -> updated, 400 -> invalid data, 409 -> duplicate register number
 */
export const updateInformation = asyncHandler(async (req, res) => {
  const fields = pickSubmittedFields(req.body);
  const student = req.student;

  await assertNoDuplicate(fields, student._id);

  SUBMITTABLE_FIELDS.forEach((field) => {
    if (fields[field] !== undefined) student[field] = fields[field];
  });

  student.submittedAt = new Date();
  await student.save();

  successResponse(res, {
    statusCode: 200,
    message: 'Student information updated successfully',
    data: { student: student.toPublic() },
  });
});
