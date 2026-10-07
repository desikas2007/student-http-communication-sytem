import { api } from './api';

/** Student service - profile retrieval (GET) and information submission (POST/PUT). */

/** GET /api/students/profile */
export const fetchProfile = async () => {
  const response = await api.get('/students/profile');
  return response.data.data;
};

/**
 * POST /api/students/information
 * 201 Created on success, 400 on incomplete data, 409 on duplicate register number.
 */
export const submitInformation = async (payload) => {
  const response = await api.post('/students/information', payload);
  return response.data;
};

/** PUT /api/students/information - partial update, 200 OK. */
export const updateInformation = async (payload) => {
  const response = await api.put('/students/information', payload);
  return response.data;
};
