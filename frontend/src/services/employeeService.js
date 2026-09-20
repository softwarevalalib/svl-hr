import axios from 'axios';
import { authService } from './authService';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const employeeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/employees/stats/summary');
    return response.data;
  },
};

export default employeeService;
