import { Router } from 'express';
import { translateTexts, streamTextToSpeech } from '../controllers/translate.controller.js';

const router = Router();

// POST /api/translate
router.post('/', translateTexts);

// GET /api/translate/tts?lang=ta&text=...
router.get('/tts', streamTextToSpeech);

export default router;

