const GmailState = require('../models/GmailState');
const Email = require('../models/Email');
const {
  fetchHistoryChanges,
  getCurrentHistoryId,
  searchEmails
} = require('../integrations/gmail/fetcher');
const { processEmailBatch } = require('../services/emailProcessor');
const { sendMessage } = require('../integrations/telegram/sender');
const { formatHourlyDigest } = require('../integrations/telegram/formatter');
const logger = require('../utils/logger');

/**
 * Polls Gmail for new emails since the last recorded historyId / 1-hour window
 * Sends an hourly summary if new emails arrived, or stays silent if 0 emails arrived.
 */
async function runEmailPollJob(options = {}) {
  const { sendHourlySummary = true } = options;
  logger.info('🔍 Starting 1-hour periodic Gmail polling job...');

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

    // 3. Process new emails (with immediate alerts enabled for Important emails)
    let processedDocs = [];
    if (messageIdsToProcess.length > 0) {
      logger.info(`Found ${messageIdsToProcess.length} new email(s) to process.`);
      processedDocs = await processEmailBatch(messageIdsToProcess, { shouldNotify: true });
    } else {
      logger.info('✨ No new emails found during this 1-hour polling cycle. Staying silent.');
    }

    // 4. If new emails were processed in this 1-hour cycle, send the Hourly Digest to Telegram
    if (processedDocs.length > 0 && sendHourlySummary) {
      try {
        const hourlyDigestMessage = formatHourlyDigest(processedDocs);
        if (hourlyDigestMessage) {
          await sendMessage(hourlyDigestMessage);
          logger.info(`📬 Sent Hourly Digest with ${processedDocs.length} new email(s) to Telegram`);
        }

        // Mark these emails as seen and included
        const docIds = processedDocs.map((doc) => doc._id);
        await Email.updateMany(
          { _id: { $in: docIds } },
          { $set: { userSeen: true, userSeenAt: new Date(), digestIncluded: true } }
        );
      } catch (tgErr) {
        logger.error({ tgErr }, 'Failed to deliver hourly digest message to Telegram');
      }
    }

    // 5. Update Gmail state in MongoDB
    state.lastHistoryId = nextHistoryId;
    state.lastSuccessfulPollAt = new Date();
    state.totalEmailsProcessed = (state.totalEmailsProcessed || 0) + processedDocs.length;
    await state.save();

    logger.info(
      {
        processedCount: processedDocs.length,
        historyId: nextHistoryId
      },
      '✅ 1-hour Gmail polling job completed successfully'
    );

    return {
      status: 'success',
      processedCount: processedDocs.length,
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
