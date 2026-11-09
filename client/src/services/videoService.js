import api from './api';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Video Storage API Service
 * Handles uploading recorded video blobs to MongoDB GridFS and retrieving streaming URLs
 */
export const videoService = {
  /**
   * Uploads candidate video recording to MongoDB GridFS
   * POST /api/videos/:token/upload
   * @param {string} token - Raw candidate verification token
   * @param {number} questionNumber - 1, 2, or 3
   * @param {Blob} videoBlob - Recorded video file blob
   * @param {number} durationSeconds - Length of recorded answer
   * @returns {Promise<Object>}
   */
  async uploadVideo(token, questionNumber, videoBlob, durationSeconds = 0) {
    const formData = new FormData();
    const filename = `recording_q${questionNumber}.webm`;

    // Ensure blob has a valid video MIME type
    let finalBlob = videoBlob;
    const detectedType =
      videoBlob?.type && videoBlob.type.startsWith('video/')
        ? videoBlob.type
        : 'video/webm';

    if (videoBlob instanceof Blob) {
      if (!videoBlob.type || !videoBlob.type.startsWith('video/')) {
        finalBlob = new Blob([videoBlob], { type: 'video/webm' });
      }
    } else if (videoBlob) {
      finalBlob = new Blob([videoBlob], { type: 'video/webm' });
    }

    try {
      const file = new File([finalBlob], filename, { type: detectedType });
      formData.append('video', file, filename);
    } catch (e) {
      // Fallback for environments where File constructor is not supported
      formData.append('video', finalBlob, filename);
    }

    formData.append('questionNumber', questionNumber.toString());
    formData.append('durationSeconds', durationSeconds.toString());

    // Do NOT set Content-Type header manually; browser + Axios will set multipart/form-data with boundary
    const response = await api.post(`/videos/${token}/upload`, formData, {
      timeout: 60000 // 60-second timeout for video upload
    });

    return response;
  },

  /**
   * Gets streaming URL for a recorded question
   * GET /api/videos/:token/:questionNumber
   * @param {string} token
   * @param {number} questionNumber
   * @returns {string}
   */
  getVideoUrl(token, questionNumber) {
    if (!token || !questionNumber) return '';
    return `${baseURL}/videos/${token}/${questionNumber}`;
  }
};

export default videoService;

