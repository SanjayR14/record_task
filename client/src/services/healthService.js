import api from './api';

/**
 * Health check API service
 */
export const checkBackendHealth = async () => {
  return await api.get('/health');
};

