import Verification from '../models/Verification.js';
import Feedback from '../models/Feedback.js';
import { hashToken } from '../utils/token.js';
import { VideoStorageService } from '../services/videoStorage.service.js';
import { S3VideoStorageService } from '../services/s3VideoStorage.service.js';
import { reverseGeocodeLocation } from '../services/geocoding.service.js';

/**
 * Validates verification link and returns candidate progress
 * GET /api/verifications/:token
 */
export const getVerificationSession = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Verification token is required'
      });
    }

    const tokenHash = hashToken(token);

    // Look up verification by hashed token (or token for legacy records)
    let session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    // Development / demo candidate auto-seed for convenience
    if (!session && token === 'demo-candidate-2026') {
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      session = await Verification.create({
        candidateId: 'DEMO-2026',
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
    }

    // Case 1: Invalid link
    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Invalid verification link'
      });
    }

    // Case 3: Already completed (check BEFORE expiry, as required by spec)
    if (session.isCompleted || session.status === 'completed') {
      return res.status(200).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Assessment already completed',
        isCompleted: true
      });
    }

    // Case 2: Expired token
    if (new Date() > session.expiresAt) {
      return res.status(410).json({
        success: false,
        code: 'LINK_EXPIRED',
        message: 'This verification link has expired'
      });
    }

    // Case 4: Valid unfinished assessment
    const sanitizedResponses = (session.responses || []).map((r) => ({
      questionNumber: r.questionNumber,
      uploadStatus: r.uploadStatus || 'pending',
      storageProvider: r.storageProvider || (r.s3Key ? 's3' : 'gridfs'),
      s3Key: r.s3Key || null,
      mimeType: r.mimeType,
      fileSize: r.fileSize || 0,
      durationSeconds: r.durationSeconds || 0,
      recordedAt: r.recordedAt,
      hasVideo: (!!r.s3Key || !!r.gridFsFileId) && r.uploadStatus === 'completed'
    }));

    return res.status(200).json({
      success: true,
      code: 'VALID',
      data: {
        candidateId: session.candidateId,
        currentStep: session.currentStep || 'language',
        selectedLanguage: session.selectedLanguage || 'en',
        currentQuestion: session.currentQuestion || 1,
        completedInstructions: session.completedInstructions || [],
        permissions: session.permissions || {
          camera: 'unknown',
          microphone: 'unknown',
          location: 'unknown'
        },
        locationDetails: session.locationDetails || null,
        responses: sanitizedResponses,
        isCompleted: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Persist candidate progress automatically
 * PATCH /api/verifications/:token/progress
 */
export const updateVerificationProgress = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Verification link not found'
      });
    }

    // Prevent modifying completed assessments
    if (session.isCompleted || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Assessment is already completed'
      });
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      return res.status(410).json({
        success: false,
        code: 'LINK_EXPIRED',
        message: 'This verification link has expired'
      });
    }

    const {
      selectedLanguage,
      completedInstructions,
      permissions,
      currentStep,
      currentQuestion
    } = req.body;

    // Build atomic $set update so concurrent progress/permission/location requests never clobber each other
    const setFields = {};

    if (selectedLanguage && typeof selectedLanguage === 'string') {
      setFields.selectedLanguage = selectedLanguage.trim();
    }

    if (Array.isArray(completedInstructions)) {
      setFields.completedInstructions = completedInstructions;
    }

    if (permissions && typeof permissions === 'object') {
      const formatPerm = (val) => {
        if (typeof val === 'boolean') return val ? 'granted' : 'denied';
        if (['unknown', 'requesting', 'granted', 'denied', 'unavailable'].includes(val)) return val;
        return 'unknown';
      };

      if (permissions.camera !== undefined) {
        setFields['permissions.camera'] = formatPerm(permissions.camera);
      }
      if (permissions.microphone !== undefined) {
        setFields['permissions.microphone'] = formatPerm(permissions.microphone);
      }
      if (permissions.location !== undefined) {
        setFields['permissions.location'] = formatPerm(permissions.location);
      }
    }

    if (currentStep && typeof currentStep === 'string') {
      setFields.currentStep = currentStep.trim();
      if (session.status === 'pending') {
        setFields.status = 'in_progress';
      }
    }

    if (currentQuestion !== undefined) {
      const qNum = parseInt(currentQuestion, 10);
      if (!isNaN(qNum) && qNum >= 1 && qNum <= 3) {
        setFields.currentQuestion = qNum;
      }
    }

    const updatedSession =
      Object.keys(setFields).length > 0
        ? await Verification.findOneAndUpdate(
            { _id: session._id },
            { $set: setFields },
            { new: true }
          )
        : session;

    return res.status(200).json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        currentStep: updatedSession.currentStep,
        selectedLanguage: updatedSession.selectedLanguage,
        currentQuestion: updatedSession.currentQuestion,
        permissions: updatedSession.permissions,
        completedInstructions: updatedSession.completedInstructions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Final submission with duplicate prevention
 * POST /api/verifications/:token/finish
 */
export const submitVerification = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Verification link not found'
      });
    }

    // Check duplicate submission
    if (session.isCompleted || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Assessment already completed'
      });
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      return res.status(410).json({
        success: false,
        code: 'LINK_EXPIRED',
        message: 'This verification link has expired'
      });
    }

    // Validate exactly three distinct responses exist and have completed upload status
    const responses = session.responses || [];
    const validQuestions = [1, 2, 3];

    for (const qNum of validQuestions) {
      const resp = responses.find((r) => r.questionNumber === qNum);
      if (!resp || resp.uploadStatus !== 'completed' || (!resp.s3Key && !resp.gridFsFileId)) {
        return res.status(400).json({
          success: false,
          code: 'INCOMPLETE_RESPONSES',
          message: `Cannot submit verification: Response for Question ${qNum} has not been uploaded.`
        });
      }

      if (resp.s3Key) {
        if (!S3VideoStorageService.isConfigured()) {
          return res.status(503).json({
            success: false,
            code: 'S3_NOT_CONFIGURED',
            message: 'AWS S3 video storage is not configured on the server.'
          });
        }

        if (!S3VideoStorageService.isKeyOwnedBySession(resp.s3Key, session._id)) {
          return res.status(403).json({
            success: false,
            code: 'UNAUTHORIZED_VIDEO',
            message: `Security validation failed: Video for Question ${qNum} belongs to a different verification session.`
          });
        }

        const head = await S3VideoStorageService.headObject(
          resp.s3Key,
          resp.s3Bucket || S3VideoStorageService.getBucketName()
        );
        if (!head) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_VIDEO_FILE',
            message: `Cannot submit verification: Stored video for Question ${qNum} was not found in AWS S3 storage.`
          });
        }
      } else {
        // Legacy GridFS fallback check (preserved until existing GridFS data is retired)
        const gridFile = await VideoStorageService.findFileById(resp.gridFsFileId);
        if (!gridFile) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_VIDEO_FILE',
            message: `Cannot submit verification: Stored video for Question ${qNum} was not found in GridFS storage.`
          });
        }

        if (
          gridFile.metadata?.verificationId &&
          gridFile.metadata.verificationId.toString() !== session._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            code: 'UNAUTHORIZED_VIDEO',
            message: `Security validation failed: Video for Question ${qNum} belongs to a different verification session.`
          });
        }
      }
    }

    // Atomic conditional update to prevent concurrent duplicate submissions
    const updated = await Verification.findOneAndUpdate(
      {
        _id: session._id,
        isCompleted: false,
        status: { $ne: 'completed' }
      },
      {
        $set: {
          isCompleted: true,
          status: 'completed',
          currentStep: 'feedback',
          'submission.isSubmitted': true,
          'submission.submittedAt': new Date(),
          completedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Assessment already completed'
      });
    }

    return res.status(200).json({
      success: true,
      code: 'SUBMISSION_CONFIRMED',
      message: 'Assessment completed and verified successfully',
      data: {
        isCompleted: true,
        completedAt: updated.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save candidate feedback
 * POST /api/verifications/:token/feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Verification session not found'
      });
    }

    const { rating, comments, comment } = req.body;
    const ratingNum = parseInt(rating, 10);

    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    const feedbackComment = (comments || comment || '').toString().trim();
    const submittedAt = new Date();

    // Prevent duplicate feedback submissions if already provided
    if (session.feedback?.rating && session.feedback?.submittedAt) {
      return res.status(400).json({
        success: false,
        code: 'FEEDBACK_ALREADY_SUBMITTED',
        message: 'Feedback has already been submitted for this assessment'
      });
    }

    session.feedback = {
      rating: ratingNum,
      comment: feedbackComment,
      submittedAt
    };

    await session.save();

    // Also persist in separate feedback collection as required
    await Feedback.create({
      verificationId: session._id,
      candidateId: session.candidateId,
      rating: ratingNum,
      comment: feedbackComment,
      submittedAt
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        rating: ratingNum,
        comment: feedbackComment,
        submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save high-accuracy candidate GPS location and resolve accurate PIN code
 * POST /api/verifications/:token/location
 */
export const saveVerificationLocation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const session = await Verification.findOne({
      $or: [{ tokenHash }, { token }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_LINK',
        message: 'Verification link not found'
      });
    }

    if (session.isCompleted || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: 'Assessment is already completed'
      });
    }

    if (new Date() > session.expiresAt) {
      return res.status(410).json({
        success: false,
        code: 'LINK_EXPIRED',
        message: 'This verification link has expired'
      });
    }

    const lat = Number(req.body.latitude);
    const lon = Number(req.body.longitude);
    const accuracy = req.body.accuracy !== undefined ? Number(req.body.accuracy) : null;
    const clientHint = req.body.clientHint && typeof req.body.clientHint === 'object' ? req.body.clientHint : null;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_COORDINATES',
        message: 'Valid latitude and longitude coordinates are required.'
      });
    }

    const geo = await reverseGeocodeLocation(lat, lon, clientHint);

    const locationDetails = {
      latitude: lat,
      longitude: lon,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      pincode: geo.pincode || null,
      pincodeVerified: Boolean(geo.pincodeVerified),
      postOffice: geo.postOffice || null,
      district: geo.district || null,
      city: geo.city || null,
      state: geo.state || null,
      country: geo.country || null,
      formattedAddress: geo.formattedAddress || null,
      source: geo.source || null,
      capturedAt: new Date()
    };

    const setFields = {
      'permissions.location': 'granted',
      locationDetails
    };
    if (session.status === 'pending') {
      setFields.status = 'in_progress';
    }

    const updated = await Verification.findOneAndUpdate(
      { _id: session._id },
      { $set: setFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: geo.pincode
        ? `Location verified (PIN: ${geo.pincode})`
        : 'Location coordinates verified',
      data: updated.locationDetails
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVerificationSession,
  updateVerificationProgress,
  saveVerificationLocation,
  submitVerification,
  submitFeedback
};
