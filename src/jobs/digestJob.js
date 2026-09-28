const { generateAndSendMorningDigest } = require('../services/digestService');
const logger = require('../utils/logger');

/**
 * Job handler for scheduled morning digest
 */
async function runMorningDigestJob(options = {}) {
  logger.info('⏰ Executing scheduled Morning Digest job...');
  const result = await generateAndSendMorningDigest(options);
  logger.info({ result }, 'Morning Digest job execution complete.');
  return result;
}

module.exports = {
  runMorningDigestJob
};
