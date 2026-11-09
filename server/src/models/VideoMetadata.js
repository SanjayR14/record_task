import mongoose from 'mongoose';

/**
 * Video Metadata Schema
 * Tracks video recordings linked with MongoDB GridFS chunks & files
 */
const videoMetadataSchema = new mongoose.Schema(
  {
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Verification',
      required: true,
      index: true
    },
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'video/webm'
    },
    fileSizeBytes: {
      type: Number,
      required: true
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    uploadStatus: {
      type: String,
      enum: ['uploading', 'completed', 'failed'],
      default: 'completed'
    }
  },
  {
    timestamps: true
  }
);

export const VideoMetadata = mongoose.model('VideoMetadata', videoMetadataSchema);
export default VideoMetadata;

