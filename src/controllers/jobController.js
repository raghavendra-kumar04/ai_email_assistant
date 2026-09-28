const { runMorningDigestJob } = require('../jobs/digestJob');
const { runEmailPollJob } = require('../jobs/pollJob');
const logger = require('../utils/logger');

/**
 * Trigger morning digest job via external scheduler
 */
async function triggerDigestJob(req, res, next) {
  const force = req.query.force === 'true';
  logger.info({ force }, 'Job endpoint /jobs/digest triggered');

  try {
    const result = await runMorningDigestJob({ force });
    res.status(200).json({
      status: 'success',
      job: 'morning_digest',
      result
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete digest job via HTTP trigger');
    next(error);
  }
}

/**
 * Trigger periodic email polling job via external scheduler
 */
async function triggerPollJob(req, res, next) {
  logger.info('Job endpoint /jobs/poll-emails triggered');

  try {
    const result = await runEmailPollJob();
    res.status(200).json({
      status: 'success',
      job: 'poll_emails',
      result
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete email poll job via HTTP trigger');
    next(error);
  }
}

module.exports = {
  triggerDigestJob,
  triggerPollJob
};
