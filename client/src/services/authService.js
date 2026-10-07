import { api } from './api';

/** Authentication service - every call becomes a real HTTP request. */

/**
 * POST /api/auth/register
 * Persists the new student in MongoDB (201 Created) and issues no token, so the
 * caller must redirect the user to the login page.
 * @returns {Promise<{success:boolean, message:string, data:{student:object}}>}
 */
export const register = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

/**
 * POST /api/auth/login
 * @returns {Promise<{success:boolean, message:string, token:string, student:object}>}
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/** GET /api/auth/me - validates the stored JWT against the server. */
export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/** POST /api/auth/logout */
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};
