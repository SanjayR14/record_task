import mongoose from 'mongoose';

/**
 * MongoDB GridFS Bucket Configuration
 * Used for streaming, storing, and retrieving candidate video recordings
 * Bucket name defaults to 'videos' (creates videos.files and videos.chunks collections)
 */
let gridFSBucket = null;

export const initGridFS = (connection) => {
  if (!connection || !connection.db) {
    throw new Error('Valid MongoDB connection is required to initialize GridFS');
  }

  gridFSBucket = new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: 'videos'
  });

  console.log('[GridFS] Initialized "videos" storage bucket');
  return gridFSBucket;
};

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket is not initialized. Ensure database connection is established.');
  }
  return gridFSBucket;
};

