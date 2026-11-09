import { Readable } from 'stream';
import mongoose from 'mongoose';
import Verification from '../models/Verification.js';
import VideoMetadata from '../models/VideoMetadata.js';
import { hashToken } from '../utils/token.js';
import { VideoStorageService } from '../services/videoStorage.service.js';

// Allowed video MIME types produced by browsers (MediaRecorder on Chrome, Edge, Safari, Firefox, Android, iOS)
const ALLOWED_MIME_PREFIXES = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/ogg'];

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
    if (!response || !response.gridFsFileId || response.uploadStatus !== 'completed') {
      return res.status(404).json({
        success: false,
        message: `No video recording found for Question ${qNum}`
      });
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
  uploadVideoResponse,
  streamVideoByQuestion,
  streamVideo
};
