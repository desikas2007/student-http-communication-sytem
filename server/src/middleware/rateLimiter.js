import rateLimit from 'express-rate-limit';

const jsonHandler = (limitName) => (req, res) => {
  res.status(429).json({
    success: false,
    message: `Too many requests. Please wait a moment and try again (${limitName}).`,
    errorCode: 'TOO_MANY_REQUESTS',
  });
};

/** General API limit - protects the server from request floods. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: jsonHandler('general API limit'),
});

/**
 * Stricter limit for the login endpoint.
 * Demonstrates HTTP 429 Too Many Requests (test case TC10).
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: 'Too many login attempts. Please try again in a minute.',
  handler: jsonHandler('login rate limit'),
});

/**
 * Limit for account creation so the register endpoint cannot be flooded.
 * Successful sign-ups are not counted, so a retry after a validation error
 * never locks the form.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Too many sign-up attempts. Please try again in a minute.',
  handler: jsonHandler('sign-up rate limit'),
});
