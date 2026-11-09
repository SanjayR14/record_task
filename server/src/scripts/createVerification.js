import { connectDB } from '../config/db.js';
import Verification from '../models/Verification.js';
import { generateVerificationToken, hashToken } from '../utils/token.js';
import { config } from '../config/env.js';

/**
 * Development & Admin Verification Creation Script
 * Usage: npm run create:verification
 */
const run = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('Failed to establish database connection.');
      process.exit(1);
    }

    // 1. Generate 256-bit cryptographically secure token
    const rawToken = generateVerificationToken(32);

    // 2. Compute SHA-256 hash (only the hash is stored in MongoDB)
    const tokenHash = hashToken(rawToken);

    // 3. Set expiry to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 4. Create the verification record
    const candidateId = `CAN-${Date.now().toString().slice(-6)}`;
    await Verification.create({
      candidateId,
      tokenHash,
      status: 'pending',
      isCompleted: false,
      selectedLanguage: 'en',
      currentStep: 'language',
      currentQuestion: 1,
      expiresAt,
      responses: [
        { questionNumber: 1, uploadStatus: 'pending' },
        { questionNumber: 2, uploadStatus: 'pending' },
        { questionNumber: 3, uploadStatus: 'pending' }
      ]
    });

    // 5. Construct verification URL
    const clientBase = config.clientUrl || 'http://localhost:5173';
    const verificationUrl = `${clientBase}/verify/${rawToken}/language`;

    console.log('\n======================================================');
    console.log('✅ NEW CANDIDATE VERIFICATION LINK GENERATED');
    console.log('======================================================');
    console.log(`Candidate ID:     ${candidateId}`);
    console.log(`Token (256-bit):  ${rawToken}`);
    console.log(`Token SHA-256:    ${tokenHash}`);
    console.log(`Expires At:       ${expiresAt.toISOString()}`);
    console.log('------------------------------------------------------');
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error creating verification:', err);
    process.exit(1);
  }
};

run();

