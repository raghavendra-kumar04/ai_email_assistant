const { sendMessage } = require('../integrations/telegram/sender');
const { formatImportantAlert } = require('../integrations/telegram/formatter');
const Email = require('../models/Email');
const logger = require('../utils/logger');

/**
 * Evaluates whether an email warrants an immediate notification and delivers it
 * Rule: category === 'important' (per finalized decision)
 */
async function notifyIfImportant(emailDoc) {
  if (!emailDoc) return;

  // Already notified? Skip (idempotency guard)
  if (emailDoc.notificationSent) {
    return;
  }

  // Only notify if category is 'important'
  if (emailDoc.category !== 'important') {
    return;
  }

  try {
    const alertMessage = formatImportantAlert(emailDoc);
    await sendMessage(alertMessage);

    // Atomically mark notification as sent
    await Email.updateOne(
      { _id: emailDoc._id },
      { $set: { notificationSent: true } }
    );

    logger.info({ messageId: emailDoc.gmailMessageId }, '📢 Immediate Telegram alert sent for important email');
  } catch (error) {
    logger.error({ error, messageId: emailDoc.gmailMessageId }, 'Failed to send important email Telegram notification');
  }
}

module.exports = {
  notifyIfImportant
};
