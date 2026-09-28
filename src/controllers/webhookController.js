const { handleCommand } = require('./commandHandler');
const { handleNaturalLanguageQuery } = require('./intentHandler');
const logger = require('../utils/logger');

/**
 * Main Webhook entrypoint for Telegram updates
 */
async function handleTelegramWebhook(req, res) {
  const update = req.body;

  // 1. Immediately return 200 OK to Telegram so it doesn't timeout / retry
  res.status(200).json({ ok: true });

  // 2. Extract message details
  const message = update.message || update.edited_message;
  if (!message || !message.text) {
    logger.debug('Received non-text Telegram update. Ignoring.');
    return;
  }

  const text = message.text.trim();
  const chatId = String(message.chat.id);

  logger.info({ text, chatId, user: message.from?.username }, 'Received Telegram message');

  // 3. Dispatch asynchronously
  setImmediate(async () => {
    try {
      if (text.startsWith('/')) {
        await handleCommand(text, chatId);
      } else {
        await handleNaturalLanguageQuery(text, chatId);
      }
    } catch (err) {
      logger.error({ err, text, chatId }, 'Error processing Telegram update in background worker');
    }
  });
}

module.exports = {
  handleTelegramWebhook
};
