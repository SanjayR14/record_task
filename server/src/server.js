import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Connect to MongoDB & initialize GridFS bucket
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 Record Verification Server running`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`===============================================`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('[Server] Fatal startup failure:', error);
  process.exit(1);
});

