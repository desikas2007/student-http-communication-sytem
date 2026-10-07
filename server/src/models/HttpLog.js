import mongoose from 'mongoose';

/**
 * Stores a record of every relevant HTTP request/response exchange.
 * Sensitive values (passwords, tokens, authorization headers) are masked
 * by the httpLogService before they are persisted.
 */
const httpLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      maxlength: 300,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    responseHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },
    requestId: {
      type: String,
      default: '',
      maxlength: 64,
    },
  },
  {
    // Keep individual documents lean - very large payloads are truncated
    // by the service before they reach the database.
    minimize: true,
  }
);

httpLogSchema.index({ timestamp: -1 });
httpLogSchema.index({ method: 1, statusCode: 1 });
httpLogSchema.index({ studentId: 1, timestamp: -1 });

export default mongoose.model('HttpLog', httpLogSchema);
