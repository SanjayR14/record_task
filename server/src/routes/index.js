import { Router } from 'express';
import healthRoutes from './health.routes.js';
import verificationRoutes from './verification.routes.js';
import videoRoutes from './video.routes.js';
import translateRoutes from './translate.routes.js';

const router = Router();

// Health check route: GET /api/health
router.use('/health', healthRoutes);

// Candidate verification routes (both singular and plural aliases for full compatibility)
router.use('/verifications', verificationRoutes);
router.use('/verification', verificationRoutes);

// MongoDB GridFS video streaming & upload routes
router.use('/videos', videoRoutes);

// Dynamic Groq AI translation endpoint: POST /api/translate
router.use('/translate', translateRoutes);

export default router;
