import mongoose from 'mongoose';

/**
 * Feedback Collection Schema
 * Stores candidate rating and comments
 */
const feedbackSchema = new mongoose.Schema(
  {
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Verification',
      required: true,
      index: true
    },
    candidateId: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'feedback'
  }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;

