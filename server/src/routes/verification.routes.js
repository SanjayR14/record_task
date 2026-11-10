import { Router } from 'express';
import {
  getVerificationSession,
  updateVerificationProgress,
  saveVerificationLocation,
  submitVerification,
  submitFeedback
} from '../controllers/verification.controller.js';

const router = Router();

// Validation and progress endpoints
router.get('/:token', getVerificationSession);
router.patch('/:token/progress', updateVerificationProgress);
router.patch('/:token/step', updateVerificationProgress);
router.post('/:token/location', saveVerificationLocation);

// Final submission with duplicate prevention
router.post('/:token/finish', submitVerification);
router.post('/:token/submit', submitVerification);

// Feedback persistence
router.post('/:token/feedback', submitFeedback);

export default router;
