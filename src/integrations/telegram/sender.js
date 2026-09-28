const { callTelegram } = require('./client');
const logger = require('../../utils/logger');

/**
 * Send a text message to a specific Telegram chat (or default owner TELEGRAM_CHAT_ID)
 */
async function sendMessage(text, options = {}) {
  const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    logger.warn('No chat ID provided or found in TELEGRAM_CHAT_ID. Message not sent.');
    return;
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode !== undefined ? options.parseMode : 'Markdown',
    disable_web_page_preview: true,
    ...options
  };

  try {
    return await callTelegram('sendMessage', payload);
  } catch (error) {
    // If Markdown parsing fails due to special characters, retry with plain text fallback
    if (error.response?.data?.description?.includes('can\'t parse entities')) {
      logger.warn('Markdown parsing error on Telegram message. Retrying with plain text...');
      payload.parse_mode = undefined;
      return await callTelegram('sendMessage', payload);
    }
    logger.error({ error: error.message, chatId }, 'Failed to send Telegram message');
    throw error;
  }
}

/**
 * Send a typing action to indicate the bot is processing a query
 */
async function sendChatAction(chatId, action = 'typing') {
  try {
    await callTelegram('sendChatAction', {
      chat_id: chatId || process.env.TELEGRAM_CHAT_ID,
      action
    });
  } catch (err) {
    // Non-critical, ignore
  }
}

module.exports = {
  sendMessage,
  sendChatAction
};
