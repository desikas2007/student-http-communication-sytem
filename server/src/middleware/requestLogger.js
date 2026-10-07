import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { recordHttpLog } from '../services/httpLogService.js';

/** Assigns a correlation id to every request (exposed as X-Request-Id). */
export const attachRequestId = (req, res, next) => {
  req.requestId = randomUUID().split('-')[0];
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

/** Mongoose connection state used by the health endpoint and the logger. */
export const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Logs every /api request/response exchange (method, status, duration,
 * masked headers/body) to the `httpLogs` collection.
 *
 * This is the server side of the HTTP monitoring feature - it never blocks
 * the response and never throws.
 */
export const requestLogger = (req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) return next();

  const start = process.hrtime.bigint();
  let responseBody = null;

  // Capture the JSON payload that the route is about to send.
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    responseBody = payload;
    return originalJson(payload);
  };

  // Record the exact duration right before the response headers leave the server.
  const originalEnd = res.end;
  let duration = 0;
  res.end = function end(...args) {
    duration = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration.toFixed(1)}ms`);
    }
    return originalEnd.apply(this, args);
  };

  res.on('finish', () => {
    const entry = {
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      requestHeaders: req.headers,
      requestBody: req.body && Object.keys(req.body).length ? req.body : null,
      responseHeaders: res.getHeaders(),
      responseBody,
      duration: Math.round(duration * 100) / 100,
      timestamp: new Date(),
      studentId: req.student?._id || null,
      requestId: req.requestId || '',
    };

    // Fire-and-forget: monitoring must never delay or break the API.
    recordHttpLog(entry);
  });

  next();
};
