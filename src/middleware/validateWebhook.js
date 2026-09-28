const logger = require('../utils/logger');

/**
 * Validates incoming Telegram Webhook requests
 * 1. Checks secret token header (X-Telegram-Bot-Api-Secret-Token) if configured
 * 2. Checks sender chat_id matches the owner's TELEGRAM_CHAT_ID whitelist
 */
function validateTelegramWebhook(req, res, next) {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // If a secret token is configured, enforce it
  if (expectedSecret && secretHeader !== expectedSecret) {
    logger.warn('🚫 Rejected webhook: Invalid secret token');
    return res.status(403).json({ error: 'Unauthorized webhook' });
  }

  const update = req.body;
  if (!update) {
    return res.status(400).json({ error: 'Missing update body' });
  }

  // Check sender chat ID if this update contains a message
  const message = update.message || update.edited_message || update.callback_query?.message;
  if (message && message.chat) {
    const senderChatId = String(message.chat.id);
    const authorizedChatId = String(process.env.TELEGRAM_CHAT_ID || '');

    if (authorizedChatId && senderChatId !== authorizedChatId) {
      logger.warn(`🚫 Unauthorized chat ID attempted to access bot: ${senderChatId}`);
      // Return 200 to Telegram so it doesn't repeatedly retry unauthorized messages
      return res.status(200).json({ status: 'ignored_unauthorized_user' });
    }
  }

  next();
}

module.exports = validateTelegramWebhook;
