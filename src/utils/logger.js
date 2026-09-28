const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-job-secret"]',
      'req.headers["x-telegram-bot-api-secret-token"]',
      'body.token',
      'body.refreshToken',
      'body.accessToken',
      'body.password',
      'tokens',
      '*.refreshToken',
      '*.accessToken'
    ],
    censor: '[REDACTED]'
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});

module.exports = logger;
