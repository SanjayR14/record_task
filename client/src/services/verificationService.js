import api from './api';

/**
 * Verification API Service
 * Handles link validation, progress persistence, and final submission
 */
export const verificationService = {
  /**
   * Validates token and retrieves saved progress
   * GET /api/verifications/:token
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async getVerification(token) {
    try {
      const response = await api.get(`/verifications/${token}`);
      return response;
    } catch (error) {
      // If server returned structured error (e.g. 404 INVALID_LINK, 410 LINK_EXPIRED)
      if (error.data) {
        return error.data;
      }
      throw error;
    }
  },

  /**
   * Persists candidate progress to MongoDB
   * PATCH /api/verifications/:token/progress
   * @param {string} token
   * @param {Object} progressData
   * @returns {Promise<Object>}
   */
  async updateProgress(token, progressData) {
    try {
      const response = await api.patch(`/verifications/${token}/progress`, progressData);
      return response;
    } catch (error) {
      console.warn('[Progress] Non-fatal sync error:', error.message);
      return null;
    }
  },

  /**
   * Submits all 3 recorded answers and finishes the verification
   * POST /api/verifications/:token/finish
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async finishVerification(token) {
    const response = await api.post(`/verifications/${token}/finish`);
    return response;
  }
};

export default verificationService;

