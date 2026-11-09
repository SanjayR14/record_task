import api from './api';

/**
 * Feedback API Service
 * Saves candidate rating and comments to MongoDB
 */
export const feedbackService = {
  /**
   * Submits candidate rating and feedback
   * POST /api/verifications/:token/feedback
   * @param {string} token
   * @param {Object} feedbackData - { rating, comments }
   * @returns {Promise<Object>}
   */
  async submitFeedback(token, { rating, comments = '' }) {
    const response = await api.post(`/verifications/${token}/feedback`, {
      rating,
      comments
    });
    return response;
  }
};

export default feedbackService;

