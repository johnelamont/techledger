import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Helper for authenticated requests
export const authenticatedRequest = async (
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  token: string,
  data?: any
) => {
  const response = await api.request({
    method,
    url,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
export default api;