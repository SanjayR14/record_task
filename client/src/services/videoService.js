import api from './api';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Video Storage API Service
 * Handles direct-to-S3 video uploads via backend presigned PUT URLs,
 * metadata confirmation in MongoDB, and presigned GET URLs for playback.
 */
export const videoService = {
  /**
   * Uploads candidate video recording directly to AWS S3 using a backend presigned URL
   * 1. POST /api/videos/:token/presigned-upload
   * 2. PUT <presignedUploadUrl>
   * 3. POST /api/videos/:token/confirm-upload
   * @param {string} token - Raw candidate verification token
   * @param {number} questionNumber - 1, 2, or 3
   * @param {Blob} videoBlob - Recorded video file blob
   * @param {number} durationSeconds - Length of recorded answer
   * @returns {Promise<Object>}
   */
  async uploadVideo(token, questionNumber, videoBlob, durationSeconds = 0) {
    const filename = `recording_q${questionNumber}.webm`;

    // Ensure blob has a valid video MIME type
    const rawType =
      videoBlob?.type && videoBlob.type.startsWith('video/')
        ? videoBlob.type
        : 'video/webm';
    const cleanMimeType = rawType.split(';')[0].trim().toLowerCase() || 'video/webm';

    let finalBlob = videoBlob;
    if (videoBlob instanceof Blob) {
      if (!videoBlob.type || !videoBlob.type.startsWith('video/')) {
        finalBlob = new Blob([videoBlob], { type: cleanMimeType });
      }
    } else if (videoBlob) {
      finalBlob = new Blob([videoBlob], { type: cleanMimeType });
    }

    // 1. Request presigned S3 upload URL from Express backend
    const presignRes = await api.post(`/videos/${token}/presigned-upload`, {
      questionNumber,
      contentType: cleanMimeType,
      fileSize: finalBlob?.size || 0,
      filename
    });

    const { uploadUrl, s3Key, contentType } = presignRes?.data || {};
    if (!uploadUrl || !s3Key) {
      throw new Error('Failed to obtain presigned S3 upload URL from backend.');
    }

    // 2. Upload video binary directly to AWS S3 (never through MongoDB)
    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || cleanMimeType
      },
      body: finalBlob
    });

    if (!putResponse.ok) {
      throw new Error(`Direct S3 upload failed with status ${putResponse.status}`);
    }

    // 3. Confirm upload in backend so MongoDB stores metadata & S3 key
    const confirmRes = await api.post(`/videos/${token}/confirm-upload`, {
      questionNumber,
      s3Key,
      durationSeconds,
      mimeType: contentType || cleanMimeType,
      fileSize: finalBlob?.size || 0
    });

    return confirmRes;
  },

  /**
   * Fetches a fresh presigned AWS S3 download URL for playback
   * GET /api/videos/:token/:questionNumber/url
   * @param {string} token
   * @param {number} questionNumber
   * @returns {Promise<string>}
   */
  async getPresignedVideoUrl(token, questionNumber) {
    if (!token || !questionNumber) return '';
    const res = await api.get(`/videos/${token}/${questionNumber}/url`);
    return res?.data?.url || '';
  },

  /**
   * Gets playback URL for a recorded question (redirects to presigned S3 GET URL)
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
