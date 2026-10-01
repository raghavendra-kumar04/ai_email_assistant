const logger = require('../utils/logger');

/**
 * Middleware to secure job execution endpoints with X-Job-Secret header
 */
function validateJobSecret(req, res, next) {
  const secretHeader = req.headers['x-job-secret'];
  const configuredSecret = process.env.JOB_SECRET;

  if (!configuredSecret) {
    logger.error('JOB_SECRET is not configured in environment variables');
    return res.status(500).json({ error: 'Server misconfiguration: JOB_SECRET missing' });
  }

  if (!secretHeader || secretHeader !== configuredSecret) {
    logger.warn({ ip: req.ip, path: req.originalUrl }, '🚫 Unauthorized attempt to trigger job endpoint');
    return res.status(403).json({ error: 'Forbidden: Invalid or missing X-Job-Secret' });
  }

  next();
}

module.exports = validateJobSecret;
