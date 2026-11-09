import { connectDB } from '../config/db.js';
import Verification from '../models/Verification.js';
import VideoMetadata from '../models/VideoMetadata.js';
import Feedback from '../models/Feedback.js';
import { VideoStorageService } from '../services/videoStorage.service.js';
import { hashToken } from '../utils/token.js';

/**
 * Development-Only Verification Reset Script
 * Usage: node src/scripts/resetVerification.js <rawTokenOrDemo>
 */
const run = async () => {
  const targetToken = process.argv[2] || 'demo-candidate-2026';

  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('Failed to establish database connection.');
      process.exit(1);
    }

    const tokenHash = hashToken(targetToken);
    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token: targetToken }]
    });

    if (!session) {
      console.log(`[Reset] No record found for token: ${targetToken}`);
      process.exit(0);
    }

    // Delete any GridFS videos associated with this session
    if (session.responses && session.responses.length > 0) {
      for (const resp of session.responses) {
        if (resp.gridFsFileId) {
          await VideoStorageService.deleteFile(resp.gridFsFileId);
        }
      }
    }

    await VideoMetadata.deleteMany({ verificationId: session._id });
    await Feedback.deleteMany({ verificationId: session._id });

    // Reset session fields
    session.status = 'pending';
    session.isCompleted = false;
    session.currentStep = 'language';
    session.currentQuestion = 1;
    session.completedInstructions = [];
    session.permissions = { camera: 'unknown', microphone: 'unknown', location: 'unknown' };
    session.responses = [
      { questionNumber: 1, uploadStatus: 'pending' },
      { questionNumber: 2, uploadStatus: 'pending' },
      { questionNumber: 3, uploadStatus: 'pending' }
    ];
    session.submission = { isSubmitted: false, submittedAt: null };
    session.feedback = { rating: null, comment: null, submittedAt: null };
    session.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    session.completedAt = null;

    await session.save();

    console.log(`\n[Reset] Successfully reset verification session for token: ${targetToken}`);
    console.log(`Status: ${session.status}, isCompleted: ${session.isCompleted}\n`);

    process.exit(0);
  } catch (err) {
    console.error('Error resetting verification:', err);
    process.exit(1);
  }
};

run();

