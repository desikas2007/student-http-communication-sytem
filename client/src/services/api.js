import axios from 'axios';
import { logHttpEntry } from '../hooks/useHttpMonitor';

/**
 * Centralised Axios configuration.
 * Every request the React app sends goes through this file, so the API URL
 * is declared exactly once and every exchange is recorded by the monitor.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'shcs_token';
const SESSION_TOKEN_KEY = 'shcs_session_token';

/** Reads the JWT from local (remember me) or session storage. */
export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

/** Persists the JWT according to the "remember me" choice. */
export const setAuthToken = (token, remember = true) => {
  clearAuthToken();
  try {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode) - the token simply lives in memory */
  }
};

/** Removes the JWT from both storages. */
export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/** Unauthenticated client - used to demonstrate 401 responses. */
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ---------------------------------------------------------------------------
// Masking - the UI must never display a password or a raw token.
// ---------------------------------------------------------------------------
const MASK = '********';
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'confirmpassword',
  'newpassword',
  'currentpassword',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
]);

const maskString = (key, value) => {
  const lower = String(key || '').toLowerCase();
  if (lower === 'authorization') return value.replace(/^(bearer|basic|token)\s+.+$/i, '$1 ********');
  if (SENSITIVE_KEYS.has(lower)) return MASK;
  return value;
};

export const maskValue = (input, depth = 0) => {
  if (input === null || input === undefined) return null;
  if (depth > 8) return '[Max depth reached]';
  if (Array.isArray(input)) return input.map((item) => maskValue(item, depth + 1));
  if (typeof input === 'object') {
    const output = {};
    Object.entries(input).forEach(([key, value]) => {
      if (value !== null && typeof value === 'object') output[key] = maskValue(value, depth + 1);
      else if (typeof value === 'string') output[key] = maskString(key, value);
      else output[key] = value;
    });
    return output;
  }
  return input;
};

const parseIfJson = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** "/api/exams?page=1" -> path and query parts. */
const splitUrl = (config) => {
  const full = `${config.baseURL || API_BASE_URL}${config.url || ''}`;
  const path = full.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  const params = config.params ? new URLSearchParams(config.params).toString() : '';
  const query = params ? `?${params}` : '';
  return { path, endpoint: `${path}${query}`, full: `${full}${query}` };
};

const buildHeaders = (headers) => maskValue({ ...(headers || {}) });

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.metadata = { startTime: Date.now() };
  return config;
});

const recordExchange = (config, status, responseBody, responseHeaders) => {
  if (!config) return;
  const { endpoint } = splitUrl(config);
  // The monitor does not monitor itself to avoid meaningless self-reference.
  if (endpoint.startsWith('/api/http-logs')) return;

  const startTime = config.metadata?.startTime || Date.now();
  logHttpEntry({
    timestamp: new Date().toISOString(),
    method: String(config.method || 'get').toUpperCase(),
    endpoint,
    url: splitUrl(config).full,
    status,
    duration: Date.now() - startTime,
    requestHeaders: buildHeaders(config.headers),
    requestBody: maskValue(parseIfJson(config.data)),
    responseHeaders: buildHeaders(responseHeaders),
    responseBody: maskValue(responseBody),
    source: 'live',
  });
};

api.interceptors.response.use(
  (response) => {
    recordExchange(response.config, response.status, response.data, response.headers);
    return response;
  },
  (error) => {
    if (!axios.isCancel(error)) {
      const status = error.response ? error.response.status : 0;
      recordExchange(error.config, status, error.response ? error.response.data : null, error.response ? error.response.headers : null);
    }
    return Promise.reject(normalizeError(error));
  }
);

/** Converts an Axios error into an error the UI can render directly. */
export const normalizeError = (error) => {
  const normalized = new Error(
    (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'Request failed'
  );
  normalized.status = error.response ? error.response.status : 0;
  normalized.errorCode =
    (error.response && error.response.data && error.response.data.errorCode) ||
    (error.response ? 'HTTP_ERROR' : 'NETWORK_ERROR');
  normalized.errors = (error.response && error.response.data && error.response.data.errors) || [];
  normalized.response = error.response || null;
  normalized.isCanceled = axios.isCancel(error);
  return normalized;
};

/** Extracts a friendly message from any thrown error. */
export const errorMessage = (error) => {
  if (!error) return 'Something went wrong.';
  if (error.isCanceled) return 'Request canceled.';
  if (error.status === 0) return 'Cannot reach the college server. Make sure the backend is running on port 5000.';
  return error.message || 'Something went wrong.';
};

export default api;
