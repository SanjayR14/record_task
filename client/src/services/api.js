import axios from 'axios';

/**
 * Centralized Axios API client
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically remove Content-Type for FormData
// allowing the browser to set multipart/form-data with the correct boundary
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'Network request failed',
      status: error.response?.status,
      data: error.response?.data
    };
    return Promise.reject(customError);
  }
);

export default api;

