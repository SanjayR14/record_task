import { Readable } from 'stream';
import mongoose from 'mongoose';
import Verification from '../models/Verification.js';
import VideoMetadata from '../models/VideoMetadata.js';
import { hashToken } from '../utils/token.js';
import { VideoStorageService } from '../services/videoStorage.service.js';
import { S3VideoStorageService } from '../services/s3VideoStorage.service.js';

// Allowed video MIME types produced by browsers (MediaRecorder on Chrome, Edge, Safari, Firefox, Android, iOS)
const ALLOWED_MIME_PREFIXES = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/ogg'];

const normalizeMimeType = (rawMime = 'video/webm', filename = '') => {
  let mime = (rawMime || 'video/webm').split(';')[0].trim().toLowerCase();
  const filenameLower = (filename || '').toLowerCase();

  if (mime === 'text/plain' || mime === 'application/octet-stream' || !mime) {
    if (filenameLower.endsWith('.mp4')) mime = 'video/mp4';
    else if (filenameLower.endsWith('.mov')) mime = 'video/quicktime';
    else mime = 'video/webm';
  }

  const isAllowed =
    ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix)) ||
    mime === 'application/octet-stream' ||
    mime === 'video/webm';

  return { mime, isAllowed };
};

const validateActiveSession = async (token) => {
  if (!token) {
    return { status: 400, body: { success: false, message: 'Verification token is required' } };
  }

  const tokenHash = hashToken(token);
  const session = await Verification.findOne({
    $or: [{ tokenHash }, { token }]
  });

  if (!session) {
    return { status: 404, body: { success: false, code: 'INVALID_LINK', message: 'Verification link not found' } };
  }

  if (session.isCompleted || session.status === 'completed') {
    return {
      status: 400,
      body: {
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Cannot upload video: Assessment has already been completed.'
      }
    };
  }

  if (new Date() > session.expiresAt) {
    return {
      status: 410,
      body: {
        success: false,
        code: 'LINK_EXPIRED',
        message: 'Cannot upload video: This verification link has expired.'
      }
    };
  }

  return { session };
};

/**
 * Generate a presigned AWS S3 PUT URL for direct browser video upload
 * POST /api/videos/:token/presigned-upload
 */
export const getPresignedUploadUrl = async (req, res, next) => {
  try {
    if (!S3VideoStorageService.isConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'S3_NOT_CONFIGURED',
        message: 'AWS S3 video storage is not configured on the server.'
      });
    }

    const validation = await validateActiveSession(req.params.token);
    if (!validation.session) {
      return res.status(validation.status).json(validation.body);
    }
    const { session } = validation;

    const questionNumber = parseInt(req.body.questionNumber, 10);
    if (!questionNumber || questionNumber < 1 || questionNumber > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question number. Question number must be between 1 and 3.'
      });
    }

    const fileSize = Number(req.body.fileSize) || 0;
    const maxSizeBytes = 100 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Video file too large (${(fileSize / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 100MB.`
      });
    }

    const { mime, isAllowed } = normalizeMimeType(req.body.contentType, req.body.filename);
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        message: `Unsupported video format (${mime}). Please record in WebM or MP4 format.`
      });
    }

    const s3Key = S3VideoStorageService.buildObjectKey({
      verificationId: session._id,
      questionNumber,
      mimeType: mime
    });

    const presigned = await S3VideoStorageService.createPresignedUploadUrl({
      key: s3Key,
      contentType: mime
    });

    return res.status(200).json({
      success: true,
      data: {
        questionNumber,
        ...presigned
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm direct-to-S3 video upload, persist metadata in MongoDB, and clean up replaced S3/GridFS objects
 * POST /api/videos/:token/confirm-upload
 */
export const confirmS3Upload = async (req, res, next) => {
  try {
    if (!S3VideoStorageService.isConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'S3_NOT_CONFIGURED',
        message: 'AWS S3 video storage is not configured on the server.'
      });
    }

    const validation = await validateActiveSession(req.params.token);
    if (!validation.session) {
      return res.status(validation.status).json(validation.body);
    }
    const { session } = validation;

    const questionNumber = parseInt(req.body.questionNumber, 10);
    if (!questionNumber || questionNumber < 1 || questionNumber > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question number. Question number must be between 1 and 3.'
      });
    }

    const { s3Key } = req.body;
    if (!S3VideoStorageService.isKeyOwnedBySession(s3Key, session._id)) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED_S3_KEY',
        message: 'Invalid or unauthorized S3 object key for this verification session.'
      });
    }

    const bucket = S3VideoStorageService.getBucketName();
    const head = await S3VideoStorageService.headObject(s3Key, bucket);
    if (!head) {
      return res.status(404).json({
        success: false,
        code: 'S3_OBJECT_NOT_FOUND',
        message: 'Uploaded video was not found in AWS S3 storage.'
      });
    }

    const durationSeconds = parseFloat(req.body.durationSeconds) || 0;
    const { mime } = normalizeMimeType(req.body.mimeType || head.contentType);
    const fileSize = head.contentLength || Number(req.body.fileSize) || 0;

    let existingResponse = (session.responses || []).find((r) => r.questionNumber === questionNumber);
    const oldS3Key = existingResponse?.s3Key;
    const oldS3Bucket = existingResponse?.s3Bucket || bucket;
    const oldGridFsFileId = existingResponse?.gridFsFileId;

    if (!existingResponse) {
      existingResponse = {
        questionNumber,
        storageProvider: 's3',
        s3Bucket: bucket,
        s3Key,
        gridFsFileId: null,
        uploadStatus: 'completed',
        mimeType: mime,
        fileSize,
        durationSeconds,
        recordedAt: new Date()
      };
      session.responses.push(existingResponse);
    } else {
      existingResponse.storageProvider = 's3';
      existingResponse.s3Bucket = bucket;
      existingResponse.s3Key = s3Key;
      existingResponse.gridFsFileId = null;
      existingResponse.uploadStatus = 'completed';
      existingResponse.mimeType = mime;
      existingResponse.fileSize = fileSize;
      existingResponse.durationSeconds = durationSeconds;
      existingResponse.recordedAt = new Date();
    }

    if (session.currentQuestion === questionNumber && questionNumber < 3) {
      session.currentQuestion = questionNumber + 1;
    }

    await session.save();

    const filename = s3Key.split('/').pop() || `q${questionNumber}.webm`;
    await VideoMetadata.create({
      verificationId: session._id,
      questionNumber,
      storageProvider: 's3',
      s3Bucket: bucket,
      s3Key,
      gridFsFileId: null,
      filename,
      mimeType: mime,
      fileSizeBytes: fileSize,
      durationSeconds,
      uploadStatus: 'completed'
    });

    // Clean up replaced S3 object or legacy GridFS file only AFTER the new upload is confirmed
    if (oldS3Key && oldS3Key !== s3Key) {
      S3VideoStorageService.deleteObject(oldS3Key, oldS3Bucket).catch((err) => {
        console.warn(`[S3] Warning deleting replaced object ${oldS3Key}:`, err.message);
      });
      VideoMetadata.deleteOne({ s3Key: oldS3Key }).catch(() => {});
    }

    if (oldGridFsFileId) {
      VideoStorageService.deleteFile(oldGridFsFileId).catch((err) => {
        console.warn(`[GridFS] Warning deleting replaced legacy file ${oldGridFsFileId}:`, err.message);
      });
      VideoMetadata.deleteOne({ gridFsFileId: oldGridFsFileId }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Scenario Question ${questionNumber} video uploaded successfully to AWS S3.`,
      data: {
        questionNumber,
        storageProvider: 's3',
        s3Bucket: bucket,
        s3Key,
        uploadStatus: 'completed',
        durationSeconds,
        fileSize
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a presigned AWS S3 download URL for a recorded question
 * GET /api/videos/:token/:questionNumber/url
 */
export const getPresignedDownloadUrl = async (req, res, next) => {
  try {
    const { token, questionNumber } = req.params;
    const tokenHash = hashToken(token);
    const qNum = parseInt(questionNumber, 10);

    if (!token || isNaN(qNum) || qNum < 1 || qNum > 3) {
      return res.status(400).json({ success: false, message: 'Invalid token or question number' });
    }

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({ success: false, code: 'INVALID_LINK', message: 'Verification link not found' });
    }

    const response = (session.responses || []).find((r) => r.questionNumber === qNum);
    if (!response || response.uploadStatus !== 'completed' || (!response.s3Key && !response.gridFsFileId)) {
      return res.status(404).json({
        success: false,
        message: `No video recording found for Question ${qNum}`
      });
    }

    if (response.s3Key) {
      if (!S3VideoStorageService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'S3_NOT_CONFIGURED',
          message: 'AWS S3 video storage is not configured on the server.'
        });
      }

      const presigned = await S3VideoStorageService.createPresignedDownloadUrl({
        key: response.s3Key,
        bucket: response.s3Bucket || S3VideoStorageService.getBucketName()
      });

      return res.status(200).json({
        success: true,
        data: {
          storageProvider: 's3',
          ...presigned
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        storageProvider: 'gridfs',
        url: `/api/videos/${token}/${qNum}`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload candidate video recording to MongoDB GridFS
 * POST /api/videos/:token/upload
 */
export const uploadVideoResponse = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({ success: false, code: 'INVALID_LINK', message: 'Verification link not found' });
    }

    // Verify assessment is not completed
    if (session.isCompleted || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Cannot upload video: Assessment has already been completed.'
      });
    }

    // Verify expiry
    if (new Date() > session.expiresAt) {
      return res.status(410).json({
        success: false,
        code: 'LINK_EXPIRED',
        message: 'Cannot upload video: This verification link has expired.'
      });
    }

    // Verify question number
    const questionNumber = parseInt(req.body.questionNumber, 10);
    if (!questionNumber || questionNumber < 1 || questionNumber > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question number. Question number must be between 1 and 3.'
      });
    }

    // Verify file presence
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No video file data received.'
      });
    }

    // Verify file size (maximum 100MB)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (req.file.size > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Video file too large (${(req.file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 100MB.`
      });
    }

    // Validate and normalize MIME type
    let rawMime = req.file.mimetype || 'video/webm';
    const filenameLower = (req.file.originalname || '').toLowerCase();

    // If browser/multer identified as text/plain or octet-stream, infer from filename or default to video/webm
    if (rawMime === 'text/plain' || rawMime === 'application/octet-stream' || !rawMime) {
      if (filenameLower.endsWith('.webm') || filenameLower.includes('recording_q')) {
        rawMime = 'video/webm';
      } else if (filenameLower.endsWith('.mp4')) {
        rawMime = 'video/mp4';
      } else if (filenameLower.endsWith('.mov')) {
        rawMime = 'video/quicktime';
      } else {
        rawMime = 'video/webm';
      }
    }

    const isAllowedMime =
      ALLOWED_MIME_PREFIXES.some((prefix) => rawMime.toLowerCase().startsWith(prefix)) ||
      rawMime === 'application/octet-stream' ||
      rawMime === 'video/webm';

    if (!isAllowedMime) {
      return res.status(415).json({
        success: false,
        message: `Unsupported video format (${rawMime}). Please record in WebM or MP4 format.`
      });
    }

    const durationSeconds = parseFloat(req.body.durationSeconds) || 0;
    const cleanTokenId = session._id.toString().slice(-6);
    const filename = `rec_${cleanTokenId}_q${questionNumber}_${Date.now()}.webm`;

    // Retake workflow: Identify any existing GridFS file ID to clean up AFTER replacement succeeds
    let existingResponse = (session.responses || []).find((r) => r.questionNumber === questionNumber);
    const oldGridFsFileId = existingResponse?.gridFsFileId;

    // 1. Stream the new video into MongoDB GridFS
    const uploadStream = VideoStorageService.openUploadStream(filename, {
      verificationId: session._id,
      candidateId: session.candidateId,
      questionNumber,
      mimeType: rawMime,
      fileSize: req.file.size,
      durationSeconds
    });

    const readableStream = Readable.from(req.file.buffer);

    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    const newGridFsFileId = uploadStream.id;

    // 2. Update session response record only AFTER GridFS upload is finalized
    if (!existingResponse) {
      existingResponse = {
        questionNumber,
        gridFsFileId: newGridFsFileId,
        uploadStatus: 'completed',
        mimeType: rawMime,
        fileSize: req.file.size,
        durationSeconds,
        recordedAt: new Date()
      };
      session.responses.push(existingResponse);
    } else {
      existingResponse.gridFsFileId = newGridFsFileId;
      existingResponse.uploadStatus = 'completed';
      existingResponse.mimeType = rawMime;
      existingResponse.fileSize = req.file.size;
      existingResponse.durationSeconds = durationSeconds;
      existingResponse.recordedAt = new Date();
    }

    // Advance session question tracker if applicable
    if (session.currentQuestion === questionNumber && questionNumber < 3) {
      session.currentQuestion = questionNumber + 1;
    }

    await session.save();

    // 3. Register in VideoMetadata collection
    await VideoMetadata.create({
      verificationId: session._id,
      questionNumber,
      gridFsFileId: newGridFsFileId,
      filename,
      mimeType: rawMime,
      fileSizeBytes: req.file.size,
      durationSeconds,
      uploadStatus: 'completed'
    });

    // 4. Retake cleanup: Safely delete the previous GridFS file ONLY AFTER replacement succeeded
    if (oldGridFsFileId && oldGridFsFileId.toString() !== newGridFsFileId.toString()) {
      VideoStorageService.deleteFile(oldGridFsFileId).catch((err) => {
        console.warn(`[GridFS] Warning deleting replaced file ${oldGridFsFileId}:`, err.message);
      });
      VideoMetadata.deleteOne({ gridFsFileId: oldGridFsFileId }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Scenario Question ${questionNumber} video uploaded successfully to MongoDB GridFS.`,
      data: {
        questionNumber,
        fileId: newGridFsFileId,
        uploadStatus: 'completed',
        durationSeconds,
        fileSize: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve and stream video recording by verification token and question number
 * GET /api/videos/:token/:questionNumber
 */
export const streamVideoByQuestion = async (req, res, next) => {
  try {
    const { token, questionNumber } = req.params;
    const tokenHash = hashToken(token);
    const qNum = parseInt(questionNumber, 10);

    if (!token || isNaN(qNum) || qNum < 1 || qNum > 3) {
      return res.status(400).json({ success: false, message: 'Invalid token or question number' });
    }

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({ success: false, code: 'INVALID_LINK', message: 'Verification link not found' });
    }

    const response = (session.responses || []).find((r) => r.questionNumber === qNum);
    if (!response || response.uploadStatus !== 'completed' || (!response.s3Key && !response.gridFsFileId)) {
      return res.status(404).json({
        success: false,
        message: `No video recording found for Question ${qNum}`
      });
    }

    // Redirect to presigned S3 GET URL when stored in AWS S3
    if (response.s3Key) {
      if (!S3VideoStorageService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'S3_NOT_CONFIGURED',
          message: 'AWS S3 video storage is not configured on the server.'
        });
      }

      const presigned = await S3VideoStorageService.createPresignedDownloadUrl({
        key: response.s3Key,
        bucket: response.s3Bucket || S3VideoStorageService.getBucketName()
      });
      return res.redirect(302, presigned.url);
    }

    const file = await VideoStorageService.findFileById(response.gridFsFileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Video file was not found in GridFS storage'
      });
    }

    // Security check: Verify file ownership
    if (
      file.metadata?.verificationId &&
      file.metadata.verificationId.toString() !== session._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to video'
      });
    }

    return streamFileToResponse(file, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Stream video by GridFS ObjectId
 * GET /api/videos/:fileId
 */
export const streamVideo = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid video file ID' });
    }

    const file = await VideoStorageService.findFileById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Video file not found' });
    }

    return streamFileToResponse(file, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to stream GridFS file with HTTP Range support for mobile seeking
 */
const streamFileToResponse = (file, req, res) => {
  const mimeType = file.metadata?.mimeType || 'video/webm';
  const fileSize = file.length;
  const range = req.headers.range;

  // Support HTTP Range requests for seeking and iOS Safari playback
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).send('Requested range not satisfiable');
    }

    const chunkSize = end - start + 1;
    const downloadStream = VideoStorageService.openDownloadStream(file._id, {
      start,
      end: end + 1
    });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType
    });

    return downloadStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes'
    });

    const downloadStream = VideoStorageService.openDownloadStream(file._id);
    return downloadStream.pipe(res);
  }
};

export default {
  getPresignedUploadUrl,
  confirmS3Upload,
  getPresignedDownloadUrl,
  uploadVideoResponse,
  streamVideoByQuestion,
  streamVideo
};
