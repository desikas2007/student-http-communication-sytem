import { api } from './api';

/** Examination service - read-only HTTP GET endpoints. */

/**
 * GET /api/exams
 * @returns {Promise<{count:number, examinations:Array}>}
 */
export const fetchExaminations = async (params = {}) => {
  const response = await api.get('/exams', { params });
  return response.data.data;
};

/** GET /api/exams/:id */
export const fetchExaminationById = async (id) => {
  const response = await api.get(`/exams/${id}`);
  return response.data.data;
};
