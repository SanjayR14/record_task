import mongoose from 'mongoose';
import { config } from './env.js';
import { initGridFS } from './gridfs.js';

const tryConnect = async (uri, dbName, serverSelectionTimeoutMS) => {
  const conn = await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS
  });

  console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  console.log(`[MongoDB] Database name: ${conn.connection.name}`);

  // Initialize GridFS bucket for video storage
  initGridFS(conn.connection);

  return conn;
};

/**
 * Connect to MongoDB Atlas or local MongoDB instance
 * Separates database initialization from HTTP server setup
 */
export const connectDB = async () => {
  const dbName = process.env.MONGODB_DB_NAME || 'record_video_verification';

  // 1. Try configured MONGODB_URI if present and not containing placeholder (with retry for Atlas SRV/TLS latency)
  if (config.mongoUri && !config.mongoUri.includes('<db_password>')) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await tryConnect(config.mongoUri, dbName, 15000);
      } catch (error) {
        console.warn(`[MongoDB] Remote connection attempt ${attempt} failed: ${error.message}`);
      }
    }
    console.warn('[MongoDB] Remote connection failed after retries. Checking local MongoDB instance...');
  }

  // 2. Fallback to local MongoDB instance
  try {
    const localUri = 'mongodb://127.0.0.1:27017/record_video_verification';
    return await tryConnect(localUri, dbName, 4000);
  } catch (error) {
    console.error(`[MongoDB] All MongoDB connection attempts failed: ${error.message}`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Database connection disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection runtime error:', err.message);
});

export default connectDB;
