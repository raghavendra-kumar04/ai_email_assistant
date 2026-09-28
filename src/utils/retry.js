const logger = require('./logger');

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a function with exponential backoff retries
 * @param {Function} fn - async function to execute
 * @param {Object} options - retry options
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    context = 'Operation'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on non-retryable errors (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden)
      const status = error.status || error.response?.status || error.code;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        logger.warn(`[${context}] Non-retryable error (${status}). Aborting retry.`);
        throw error;
      }

      if (attempt === maxRetries) {
        logger.error(`[${context}] All ${maxRetries} retry attempts failed.`);
        break;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 200; // jitter to avoid thundering herds
      const totalDelay = delay + jitter;

      logger.warn(`[${context}] Attempt ${attempt} failed. Retrying in ${Math.round(totalDelay)}ms...`);
      await sleep(totalDelay);
    }
  }

  throw lastError;
}

module.exports = {
  sleep,
  withRetry
};
