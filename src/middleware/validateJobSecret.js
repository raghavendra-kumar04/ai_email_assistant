const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests to scheduled job endpoints
 * Enforces X-Job-Secret header or ?secret= query parameter
 */
function validateJobSecret(req, res, next) {
  const secretFromHeader = req.headers['x-job-secret'];
  const secretFromQuery = req.query.secret;
  const expectedSecret = process.env.JOB_SECRET;

  if (!expectedSecret) {
    logger.error('❌ JOB_SECRET is not configured in environment variables');
    return res.status(500).json({ error: 'Server misconfiguration: JOB_SECRET missing' });
  }

  const providedSecret = secretFromHeader || secretFromQuery;

  if (!providedSecret || providedSecret !== expectedSecret) {
    logger.warn(`🚫 Unauthorized attempt to trigger job at ${req.originalUrl}`);
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing job secret' });
  }

  next();
}

module.exports = validateJobSecret;
