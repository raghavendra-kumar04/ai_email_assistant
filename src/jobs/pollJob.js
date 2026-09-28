const GmailState = require('../models/GmailState');
const {
  fetchHistoryChanges,
  getCurrentHistoryId,
  searchEmails
} = require('../integrations/gmail/fetcher');
const { processEmailBatch } = require('../services/emailProcessor');
const logger = require('../utils/logger');

/**
 * Polls Gmail for new emails since the last recorded historyId
 */
async function runEmailPollJob() {
  logger.info('🔍 Starting periodic Gmail polling job...');

  const state = await GmailState.getState();
  state.lastPollAt = new Date();

  try {
    let messageIdsToProcess = [];
    let nextHistoryId = state.lastHistoryId;

    // 1. If we don't have a historyId yet, establish a baseline
    if (!state.lastHistoryId) {
      logger.info('No prior historyId found. Initializing history tracking baseline...');
      const currentId = await getCurrentHistoryId();
      nextHistoryId = currentId;

      // Ingest any recent emails from the last 1 hour
      const oneHourAgo = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
      const recentEmails = await searchEmails(`after:${oneHourAgo}`, 15);
      messageIdsToProcess = recentEmails.map((e) => e.gmailMessageId);
    } else {
      // 2. Fetch incremental history changes
      const historyResult = await fetchHistoryChanges(state.lastHistoryId);
      messageIdsToProcess = historyResult.messageIds;
      nextHistoryId = historyResult.latestHistoryId;

      if (historyResult.wasReset) {
        logger.warn('History ID was reset due to expiry. Baseline re-established.');
      }
    }

    // 3. Process new emails (with immediate notification enabled for important emails)
    let processedCount = 0;
    if (messageIdsToProcess.length > 0) {
      logger.info(`Found ${messageIdsToProcess.length} new email(s) to process.`);
      const processedDocs = await processEmailBatch(messageIdsToProcess, { shouldNotify: true });
      processedCount = processedDocs.length;
    } else {
      logger.info('No new emails found during this polling cycle.');
    }

    // 4. Update Gmail state in MongoDB
    state.lastHistoryId = nextHistoryId;
    state.lastSuccessfulPollAt = new Date();
    state.totalEmailsProcessed = (state.totalEmailsProcessed || 0) + processedCount;
    await state.save();

    logger.info(
      {
        processedCount,
        historyId: nextHistoryId
      },
      '✅ Gmail polling job completed successfully'
    );

    return {
      status: 'success',
      processedCount,
      historyId: nextHistoryId
    };
  } catch (error) {
    logger.error({ error }, '❌ Error during Gmail polling job');
    await state.save(); // Save lastPollAt even on failure
    throw error;
  }
}

module.exports = {
  runEmailPollJob
};
