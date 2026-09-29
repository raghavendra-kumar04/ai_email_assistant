const logger = require('../utils/logger');

const requiredEnvVars = [
  'MONGODB_URI',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'GEMINI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'JOB_SECRET'
];

function validateEnv() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logger.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    logger.warn('Please check your .env file. The server will start, but features relying on these variables may fail.');
  } else {
    logger.info('✅ All essential environment variables are set');
  }

  if (!process.env.GMAIL_REFRESH_TOKEN) {
    logger.info('ℹ️ GMAIL_REFRESH_TOKEN is not set yet. Complete the /auth/google flow to obtain and set it.');
  }

  return {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    JOB_SECRET: process.env.JOB_SECRET
  };
}

module.exports = {
  validateEnv
};
