import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/gridfs.js';

/**
 * GridFS Video Storage Service
 * Handles streaming uploads, chunked storage, byte-range downloads, and safe retake deletions
 */
export class VideoStorageService {
  /**
   * Opens an upload stream to pipe a video into MongoDB GridFS
   * @param {string} filename - Desired filename in GridFS
   * @param {Object} metadata - File metadata (verificationId, questionNumber, mimeType, fileSize)
   * @returns {GridFSBucketWriteStream}
   */
  static openUploadStream(filename, metadata = {}) {
    const bucket = getGridFSBucket();
    return bucket.openUploadStream(filename, {
      metadata: {
        verificationId: metadata.verificationId,
        questionNumber: metadata.questionNumber,
        mimeType: metadata.mimeType || 'video/webm',
        uploadedAt: new Date(),
        fileSize: metadata.fileSize || 0,
        ...metadata
      }
    });
  }

  /**
   * Opens a download stream to pipe video chunks back to HTTP response
   * @param {string|mongoose.Types.ObjectId} fileId - GridFS file _id
   * @param {Object} [options] - Stream options such as { start, end } for range requests
   * @returns {GridFSBucketReadStream}
   */
  static openDownloadStream(fileId, options = {}) {
    const bucket = getGridFSBucket();
    const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
    return bucket.openDownloadStream(objectId, options);
  }

  /**
   * Finds a file record in the `videos.files` collection
   * @param {string|mongoose.Types.ObjectId} fileId - GridFS file _id
   * @returns {Promise<Object|null>}
   */
  static async findFileById(fileId) {
    try {
      const bucket = getGridFSBucket();
      const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
      const files = await bucket.find({ _id: objectId }).toArray();
      return files[0] || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Safely deletes a video file and its associated chunks from GridFS
   * @param {string|mongoose.Types.ObjectId} fileId - GridFS file _id
   * @returns {Promise<boolean>}
   */
  static async deleteFile(fileId) {
    try {
      if (!fileId) return false;
      const bucket = getGridFSBucket();
      const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
      await bucket.delete(objectId);
      return true;
    } catch (err) {
      console.warn(`[GridFS] Safe delete warning for ${fileId}:`, err.message);
      return false;
    }
  }
}

export default VideoStorageService;
