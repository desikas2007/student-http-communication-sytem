import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import httpLogRoutes from './routes/httpLogRoutes.js';
import demoRoutes from './routes/demoRoutes.js';

import { attachRequestId, requestLogger, isDbConnected } from './middleware/requestLogger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Needed so express-rate-limit can read the real client IP behind a proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Accepts the configured CLIENT_URL plus any local dev origin
 * (localhost / 127.0.0.1 on an arbitrary port), so the Vite dev server,
 * a LAN preview and Postman all work without extra configuration.
 */
const isOriginAllowed = (origin) => {
  if (!origin) return true; // non-browser clients (curl, Postman)
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
};

// --- Security middleware -------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: the React dev server (5173) is allowed to call this API (5000).
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // Headers a browser is allowed to read from the response (visible in DevTools).
    exposedHeaders: ['X-Request-Id', 'X-Response-Time', 'RateLimit-Limit', 'RateLimit-Remaining'],
    credentials: false,
    maxAge: 600,
  })
);

// --- Body parsing --------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// --- Request logging (console) -------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- HTTP monitoring pipeline --------------------------------------------
app.use(attachRequestId); // X-Request-Id on every response
app.use(requestLogger); // persists masked request/response to MongoDB
app.use('/api', apiLimiter); // 429 Too Many Requests protection

// --- Health check --------------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student-College HTTP Communication API',
    data: {
      endpoints: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        exams: 'GET /api/exams',
        profile: 'GET /api/students/profile',
        information: 'POST /api/students/information',
        httpLogs: 'GET /api/http-logs',
        statistics: 'GET /api/http-logs/statistics',
      },
    },
  });
});

app.get('/api/health', (_req, res) => {
  const connected = isDbConnected();
  res.status(200).json({
    success: true,
    message: connected ? 'Service operational' : 'Database unavailable',
    data: {
      status: 'ok',
      database: connected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

// --- API routes ----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/http-logs', httpLogRoutes);
app.use('/api/demo', demoRoutes);

// --- 404 + centralised error handling ------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
