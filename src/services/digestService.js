const Email = require('../models/Email');
const DigestLog = require('../models/DigestLog');
const { searchEmails } = require('../integrations/gmail/fetcher');
const { processEmailBatch } = require('./emailProcessor');
const { sendMessage } = require('../integrations/telegram/sender');
const { formatMorningDigest } = require('../integrations/telegram/formatter');
const {
  getTodayISTDateString,
  getStartOfDayUTC
} = require('../utils/dateHelpers');
const logger = require('../utils/logger');

/**
 * Generates and delivers the morning email digest
 */
async function generateAndSendMorningDigest(options = {}) {
  const { force = false } = options;
  const todayIST = getTodayISTDateString();

  // 1. Idempotency Check: Was digest already sent today?
  const existingLog = await DigestLog.findOne({ date: todayIST });
  if (existingLog && existingLog.status === 'sent' && !force) {
    logger.info(`Morning digest for ${todayIST} has already been sent. Skipping duplicate run.`);
    return { status: 'already_sent', date: todayIST };
  }

  logger.info(`Starting morning digest generation for ${todayIST}...`);

  try {
    const startOfTodayUTC = getStartOfDayUTC(todayIST);
    // Also look back 24 hours to catch evening emails
    const lookbackTimeUTC = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Fetch fresh emails from Gmail for the past 24 hours to ensure no missed emails
    const unixTimestamp = Math.floor(lookbackTimeUTC.getTime() / 1000);
    const gmailQuery = `after:${unixTimestamp}`;

    const recentGmailEmails = await searchEmails(gmailQuery, 30);
    const messageIds = recentGmailEmails.map((e) => e.gmailMessageId);

    // Process any emails not yet classified (don't re-notify individually, digest will summarize)
    if (messageIds.length > 0) {
      await processEmailBatch(messageIds, { shouldNotify: false });
    }

    // 3. Fetch all emails received since lookback time from MongoDB
    const relevantEmails = await Email.find({
      receivedAt: { $gte: lookbackTimeUTC }
    }).sort({ receivedAt: -1 });

    const stats = {
      emailCount: relevantEmails.length,
      importantCount: relevantEmails.filter((e) => e.category === 'important').length,
      actionRequiredCount: relevantEmails.filter(
        (e) => e.requiresAction || e.category === 'action_required'
      ).length,
      informationalCount: relevantEmails.filter(
        (e) => e.category === 'informational' && !e.requiresAction
      ).length
    };

    // 4. Format and send Telegram message
    const digestMessage = formatMorningDigest(stats, relevantEmails);
    await sendMessage(digestMessage);

    // Mark these emails as included in digest
    if (relevantEmails.length > 0) {
      const emailIds = relevantEmails.map((e) => e._id);
      await Email.updateMany(
        { _id: { $in: emailIds } },
        { $set: { digestIncluded: true } }
      );
    }

    // 5. Record digest log for idempotency (with 7-day TTL)
    await DigestLog.findOneAndUpdate(
      { date: todayIST },
      {
        date: todayIST,
        sentAt: new Date(),
        emailCount: stats.emailCount,
        importantCount: stats.importantCount,
        actionRequiredCount: stats.actionRequiredCount,
        informationalCount: stats.informationalCount,
        status: 'sent'
      },
      { upsert: true, new: true }
    );

    logger.info(`✅ Morning digest for ${todayIST} successfully delivered!`);
    return { status: 'sent', date: todayIST, stats };
  } catch (error) {
    logger.error({ error }, '❌ Failed to generate or send morning digest');

    // Attempt fallback minimal digest alert if possible
    try {
      await sendMessage(
        `⚠️ *Morning Digest Notice*\n\nUnable to complete full AI summary this morning. Please check your inbox or use \`/today\` to fetch recent updates.`
      );
    } catch (telegramErr) {
      logger.error({ telegramErr }, 'Failed to send fallback digest message');
    }

    throw error;
  }
}

module.exports = {
  generateAndSendMorningDigest
};
