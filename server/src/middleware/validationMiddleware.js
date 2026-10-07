import { validationResult } from 'express-validator';
import { ApiError } from '../utils/response.js';

/**
 * Runs express-validator rules and converts failures into a 400 response:
 * { success:false, message, errorCode:'VALIDATION_ERROR', errors:[{field,message}] }
 *
 * Usage: router.post('/path', validate([body('email').isEmail()]), handler)
 */
export const validate = (rules = []) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((issue) => ({
      field: issue.path || issue.param,
      message: issue.msg,
    }));

    next(
      new ApiError(
        400,
        'Validation failed. Please check the highlighted fields.',
        'VALIDATION_ERROR',
        errors
      )
    );
  },
];

/**
 * Builds the validation chain at request time, e.g. to validate only the
 * fields that were actually supplied in a partial (PUT) update.
 *
 * Usage: router.put('/path', validateDynamic((req) => rulesFor(req.body)), handler)
 */
export const validateDynamic = (getRules) => (req, res, next) => {
  const middlewares = validate(getRules(req) || []);
  let index = 0;

  const run = (err) => {
    if (err) return next(err);
    const middleware = middlewares[index++];
    if (!middleware) return next();
    return middleware(req, res, run);
  };

  return run();
};

/** Trims and normalises a string before validation. */
export const clean = (value) => (typeof value === 'string' ? value.trim() : value);
