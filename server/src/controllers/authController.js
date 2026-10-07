import Student from '../models/Student.js';
import { ApiError, successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * POST /api/auth/register
 * Body: { name, registerNumber, email, password, department, year, section, phone }
 *
 * The new student is persisted in MongoDB first; only when the write succeeds
 * does the API answer 201 and the browser redirect to the login page.
 * No token is issued here - the account must be verified through login.
 *
 * 201 -> account created
 * 400 -> validation error (handled by the validation middleware)
 * 409 -> email or register number already registered
 */
export const register = asyncHandler(async (req, res) => {
  const { name, registerNumber, email, password, department, year, section, phone } = req.body;

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedRegisterNumber = String(registerNumber).trim().toUpperCase();

  // Never let two accounts share an email or a register number.
  const existing = await Student.findOne({
    $or: [{ email: normalizedEmail }, { registerNumber: normalizedRegisterNumber }],
  }).select('email registerNumber');

  if (existing) {
    const emailTaken = existing.email === normalizedEmail;
    throw ApiError.conflict(
      emailTaken
        ? 'An account with this email already exists. Please sign in instead.'
        : 'An account with this register number already exists. Please sign in instead.',
      emailTaken ? 'EMAIL_ALREADY_REGISTERED' : 'REGISTER_NUMBER_ALREADY_REGISTERED'
    );
  }

  // bcrypt hash (cost 12) - the plain text password is never stored.
  const passwordHash = await Student.hashPassword(password);

  let student;
  try {
    student = await Student.create({
      name: String(name).trim(),
      registerNumber: normalizedRegisterNumber,
      email: normalizedEmail,
      passwordHash,
      department: String(department).trim(),
      year: Number(year),
      section: String(section).trim().toUpperCase(),
      phone: phone ? String(phone).trim() : '',
      // Registration already collected the full student record.
      informationSubmitted: true,
      submittedAt: new Date(),
    });
  } catch (error) {
    // Rare race: another request inserted the same unique value in between.
    if (error.code === 11000) {
      throw ApiError.conflict(
        'An account with these details already exists. Please sign in instead.',
        'DUPLICATE_ACCOUNT'
      );
    }
    throw error;
  }

  successResponse(res, {
    statusCode: 201,
    message: 'Account created successfully. Please sign in to continue.',
    data: { student: student.toPublic() },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * 200 -> credentials valid, returns JWT + student
 * 401 -> invalid credentials
 * 400 -> validation error (handled by validation middleware)
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email: String(email).toLowerCase().trim() }).select(
    '+passwordHash'
  );

  // Same message for unknown email and wrong password so the API does not
  // reveal which accounts exist.
  if (!student) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await student.comparePassword(password);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = generateToken(student._id);
  const studentData = student.toPublic();

  successResponse(res, {
    statusCode: 200,
    message: 'Login successful',
    data: { token, student: studentData },
    // Also exposed at the top level to match the documented contract.
    extra: { token, student: studentData },
  });
});

/**
 * GET /api/auth/me
 * Returns the profile of the student that owns the presented JWT.
 * 200 -> authenticated, 401 -> missing/invalid token
 */
export const getMe = asyncHandler(async (req, res) => {
  successResponse(res, {
    statusCode: 200,
    message: 'Authenticated',
    data: { student: req.student.toPublic() },
  });
});

/**
 * POST /api/auth/logout
 * Stateless JWT logout - the client discards its token.
 * 200 -> always succeeds so the UI can clear its session safely.
 */
export const logout = asyncHandler(async (_req, res) => {
  successResponse(res, {
    statusCode: 200,
    message: 'Logged out successfully',
    data: { loggedOut: true },
  });
});
