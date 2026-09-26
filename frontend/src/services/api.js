import axios from 'axios';

/**
 * Resolve the backend API base URL dynamically.
 * - In Vercel unified deployment: defaults to relative '/api' (same-origin requests).
 * - In local development: defaults to '/api' which is proxied by Vite to http://127.0.0.1:8000.
 * - In multi-host deployment (e.g. Render/separate domains): uses VITE_API_BASE_URL.
 * - Also supports window.PACKAI_API_BASE_URL for runtime browser overrides.
 * Automatically normalizes paths so whether a trailing slash or '/api' is provided, it resolves cleanly.
 */
const getApiBaseUrl = () => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
  const windowUrl = (typeof window !== 'undefined' && window.PACKAI_API_BASE_URL) || '';
  const rawUrl = envUrl.trim() || windowUrl.trim();

  if (!rawUrl) {
    return '/api';
  }

  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getCommodities = async () => {
  const response = await api.get('/commodities');
  return response.data;
};

export const getCommodity = async (id) => {
  const response = await api.get(`/commodities/${id}`);
  return response.data;
};

export const getMaterials = async (params = {}) => {
  const response = await api.get('/materials', { params });
  return response.data;
};

export const getMaterial = async (id) => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const recommendPackaging = async (payload) => {
  const response = await api.post('/recommend', payload);
  return response.data;
};

export const compareMaterials = async (materialIds) => {
  const response = await api.post('/materials/compare', { material_ids: materialIds });
  return response.data;
};

export default api;
