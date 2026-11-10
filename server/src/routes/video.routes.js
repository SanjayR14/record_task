import { Router } from 'express';
import multer from 'multer';
import {
  getPresignedUploadUrl,
  confirmS3Upload,
  getPresignedDownloadUrl,
  uploadVideoResponse,
  streamVideoByQuestion,
  streamVideo
} from '../controllers/video.controller.js';

const router = Router();

// Configure multer memory storage with 100MB max limit (kept for legacy GridFS compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// AWS S3 presigned upload & download endpoints
router.post('/:token/presigned-upload', getPresignedUploadUrl);
router.post('/:token/confirm-upload', confirmS3Upload);
router.get('/:token/:questionNumber/url', getPresignedDownloadUrl);

// Video streaming & legacy GridFS upload endpoints
router.post('/:token/upload', upload.single('video'), uploadVideoResponse);
router.get('/:token/:questionNumber', streamVideoByQuestion);
router.get('/:fileId', streamVideo);

export default router;
