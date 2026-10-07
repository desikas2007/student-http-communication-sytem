import mongoose from 'mongoose';
import HttpLog from '../models/HttpLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'token',
  'secret',
  'apikey',
  'api_key',
  'jwt',
  'cookie',
  'set-cookie',
]);

const MAX_BODY_CHARS = 4000;
const MAX_DEPTH = 8;

/** Masks a single string value when its key is sensitive. */
const maskString = (key, value) => {
  const k = String(key || '').toLowerCase();
  if (k === 'authorization') {
    return value.replace(/^(bearer|basic|token)\s+.+$/i, '$1 ********');
  }
  if (SENSITIVE_KEYS.has(k)) return '********';
  return value;
};

/**
 * Recursively masks sensitive fields.
 * password -> "********", authorization -> "Bearer ********"
 */
export const maskObject = (input, depth = 0) => {
  if (input === null || input === undefined) return null;
  if (depth > MAX_DEPTH) return '[Max depth reached]';

  if (Array.isArray(input)) return input.map((item) => maskObject(item, depth + 1));

  if (typeof input === 'object') {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== null && typeof value === 'object') {
        output[key] = maskObject(value, depth + 1);
      } else if (typeof value === 'string') {
        output[key] = maskString(key, value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  if (typeof input === 'string') return input;
  return input;
};

/** Trims over-long text so a log document never bloats. */
export const truncateText = (text, maxChars = MAX_BODY_CHARS) =>
  text.length > maxChars
    ? `${text.slice(0, maxChars)}... [truncated, ${text.length} characters total]`
    : text;

/**
 * Prepares a request/response body for storage:
 * small JSON payloads are stored as objects, oversized ones as text.
 */
export const packBody = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return truncateText(value);

  try {
    const json = JSON.stringify(value);
    if (json === undefined) return null;
    if (json.length <= MAX_BODY_CHARS) return JSON.parse(json);
    return truncateText(json);
  } catch {
    return '[Unserializable payload]';
  }
};

/**
 * Persists one HTTP exchange. Never throws: logging must not break the API.
 */
export const recordHttpLog = async (entry) => {
  try {
    // Skip when the database is not reachable (keeps the API responsive).
    if (mongoose.connection.readyState !== 1) return null;

    return await HttpLog.create({
      method: entry.method,
      endpoint: entry.endpoint,
      statusCode: entry.statusCode,
      requestHeaders: maskObject(entry.requestHeaders || {}),
      requestBody: maskObject(packBody(entry.requestBody)),
      responseHeaders: maskObject(entry.responseHeaders || {}),
      responseBody: maskObject(packBody(entry.responseBody)),
      duration: Number(entry.duration) || 0,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      studentId: entry.studentId || null,
      requestId: entry.requestId || '',
    });
  } catch (error) {
    console.error(`[httpLog] unable to persist request log: ${error.message}`);
    return null;
  }
};

/** Builds a filtered, paginated list of stored HTTP logs. */
export const queryLogs = async ({ filter = {}, page = 1, limit = 50, sort = { timestamp: -1 } }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    HttpLog.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
    HttpLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
};

/** Aggregated statistics used by the HTTP Monitor dashboard. */
export const computeStatistics = async (filter = {}) => {
  const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];

  const [summary, byMethod, byStatus] = await Promise.all([
    HttpLog.aggregate([
      ...matchStage,
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $and: [{ $gte: ['$statusCode', 200] }, { $lt: ['$statusCode', 300] }] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
          averageResponseTime: { $avg: '$duration' },
          fastest: { $min: '$duration' },
          slowest: { $max: '$duration' },
        },
      },
    ]),
    HttpLog.aggregate([...matchStage, { $group: { _id: '$method', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    HttpLog.aggregate([...matchStage, { $group: { _id: '$statusCode', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);

  const stats = summary[0] || {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    fastest: 0,
    slowest: 0,
  };

  const methodMap = Object.fromEntries(byMethod.map((row) => [row._id, row.count]));

  return {
    total: stats.total,
    get: methodMap.GET || 0,
    post: methodMap.POST || 0,
    put: methodMap.PUT || 0,
    patch: methodMap.PATCH || 0,
    delete: methodMap.DELETE || 0,
    successful: stats.successful,
    failed: stats.failed,
    averageResponseTime: Math.round(stats.averageResponseTime || 0),
    fastestResponseTime: Math.round(stats.fastest || 0),
    slowestResponseTime: Math.round(stats.slowest || 0),
    methodDistribution: byMethod.map((row) => ({ method: row._id, count: row.count })),
    statusCodes: byStatus.map((row) => ({ statusCode: row._id, count: row.count })),
  };
};
