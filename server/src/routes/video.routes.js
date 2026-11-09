import { Router } from 'express';
import multer from 'multer';
import {
  uploadVideoResponse,
  streamVideoByQuestion,
  streamVideo
} from '../controllers/video.controller.js';

const router = Router();

// Configure multer memory storage with 100MB max limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Video upload and streaming endpoints
router.post('/:token/upload', upload.single('video'), uploadVideoResponse);
router.get('/:token/:questionNumber', streamVideoByQuestion);
router.get('/:fileId', streamVideo);

export default router;
