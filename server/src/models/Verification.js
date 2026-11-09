import mongoose from 'mongoose';

/**
 * Single Question Response Sub-Schema
 * Tracks video upload status, GridFS reference, and recording metadata
 */
const responseSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'videos.files',
      default: null
    },
    uploadStatus: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending'
    },
    mimeType: {
      type: String,
      default: 'video/webm'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    recordedAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

/**
 * Verification Session Model
 * Stores candidate verification workflow progress, permissions, token hash, responses and feedback
 */
const verificationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      default: 'Candidate'
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'expired'],
      default: 'pending',
      index: true
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    selectedLanguage: {
      type: String,
      default: 'en'
    },
    currentStep: {
      type: String,
      default: 'language'
    },
    completedInstructions: {
      type: [String],
      default: []
    },
    permissions: {
      camera: {
        type: String,
        enum: ['unknown', 'requesting', 'granted', 'denied', 'unavailable'],
        default: 'unknown'
      },
      microphone: {
        type: String,
        enum: ['unknown', 'requesting', 'granted', 'denied', 'unavailable'],
        default: 'unknown'
      },
      location: {
        type: String,
        enum: ['unknown', 'requesting', 'granted', 'denied', 'unavailable'],
        default: 'unknown'
      }
    },
    currentQuestion: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    },
    responses: {
      type: [responseSchema],
      default: () => [
        { questionNumber: 1, uploadStatus: 'pending' },
        { questionNumber: 2, uploadStatus: 'pending' },
        { questionNumber: 3, uploadStatus: 'pending' }
      ]
    },
    submission: {
      isSubmitted: {
        type: Boolean,
        default: false
      },
      submittedAt: {
        type: Date,
        default: null
      }
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      comment: {
        type: String,
        default: null
      },
      submittedAt: {
        type: Date,
        default: null
      }
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'verifications'
  }
);

// Virtual for expired status
verificationSchema.virtual('isExpired').get(function () {
  return !this.isCompleted && new Date() > this.expiresAt;
});

// Alias getter/setter so legacy questionResponses maps to responses
verificationSchema.virtual('questionResponses').get(function () {
  return this.responses;
});

export const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
