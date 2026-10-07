import { api } from './api';

/** HTTP monitoring service - reads the logs the backend persisted. */

/** GET /api/http-logs */
export const fetchLogs = async (params = {}) => {
  const response = await api.get('/http-logs', { params });
  return response.data.data;
};

/** GET /api/http-logs/:id */
export const fetchLogById = async (id) => {
  const response = await api.get(`/http-logs/${id}`);
  return response.data.data;
};

/** GET /api/http-logs/statistics */
export const fetchStatistics = async () => {
  const response = await api.get('/http-logs/statistics');
  return response.data.data;
};

/** GET /api/health - used by the dashboard system status widget. */
export const fetchHealth = async () => {
  const response = await api.get('/health');
  return response.data.data;
};
