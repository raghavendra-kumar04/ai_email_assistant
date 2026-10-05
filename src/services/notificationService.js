const { sendMessage } = require('../integrations/telegram/sender');
const { formatImportantAlert, formatActionKeyboard } = require('../integrations/telegram/formatter');
const { isDndActive } = require('../utils/dateHelpers');
const Email = require('../models/Email');
const logger = require('../utils/logger');

/**
 * Evaluates whether an email warrants an immediate notification and delivers it
 * Rule: category === 'important' or high-priority action required
 * Respects Night DND window (11:00 PM to 7:00 AM IST)
 */
async function notifyIfImportant(emailDoc) {
  if (!emailDoc) return;

  // Already notified? Skip (idempotency guard)
  if (emailDoc.notificationSent) {
    return;
  }

  // Only notify if category is 'important' or urgent action required (high priority)
  const isUrgent = emailDoc.category === 'important' || (emailDoc.requiresAction && emailDoc.priority === 'high');
  if (!isUrgent) {
    return;
  }

  // Night Mode / DND Check (11 PM - 7 AM IST)
  // Snooze alert for morning digest unless disabled via env
  if (isDndActive() && process.env.DISABLE_DND !== 'true') {
    logger.info(
      { messageId: emailDoc.gmailMessageId },
      '🌙 Night DND active (11:00 PM – 7:00 AM IST). Silently queuing alert for the 7:30 AM Morning Digest.'
    );
    return;
  }

  try {
    const alertMessage = formatImportantAlert(emailDoc);
    const replyMarkup = formatActionKeyboard(emailDoc);

    await sendMessage(alertMessage, { reply_markup: replyMarkup });

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
