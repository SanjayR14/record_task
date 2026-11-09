import mongoose from 'mongoose';

/**
 * Health check endpoint controller
 * GET /api/health
 */
export const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  return res.status(200).json({
    success: true,
    message: 'Record Verification API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus
    }
  });
};

