require('dotenv').config();

const app = require('./app');
const { validateEnv } = require('./config/env');
const { connectDB } = require('./config/database');
const { startDevPolling } = require('./integrations/telegram/polling');
const logger = require('./utils/logger');

// 1. Validate environment configuration
const envConfig = validateEnv();

const PORT = envConfig.PORT || 3000;

// 2. Connect to database and start HTTP server
async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 AI Email Assistant server running on port ${PORT} [${envConfig.NODE_ENV}]`);
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔑 Google OAuth: http://localhost:${PORT}/auth/google`);

      // In local development, enable long-polling so bot receives Telegram messages without ngrok/webhooks
      if (envConfig.NODE_ENV !== 'production') {
        startDevPolling();
      }
    });

    // Graceful shutdown listeners
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
