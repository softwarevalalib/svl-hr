import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.user.username);
      localStorage.setItem('user_level', response.data.user.user_level);
      localStorage.setItem('permissions', JSON.stringify(response.data.permissions || []));
      localStorage.setItem('roles', JSON.stringify(response.data.roles || []));
      return response.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_level');
    localStorage.removeItem('permissions');
    localStorage.removeItem('roles');
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getToken: () => localStorage.getItem('token'),

  getUserLevel: () => localStorage.getItem('user_level'),

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  downloadPdf: async (path, filename) => {
    const response = await api.get(path, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'export.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { api };
export default authService;
