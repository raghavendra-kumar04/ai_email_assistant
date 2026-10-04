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

  if (!text || typeof text !== 'string') {
    return;
  }

  // Handle messages longer than Telegram's 4096 character limit by chunking
  const MAX_CHUNK_LENGTH = 4000;
  if (text.length > MAX_CHUNK_LENGTH) {
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHUNK_LENGTH) {
        chunks.push(remaining);
        break;
      }
      let splitIdx = remaining.lastIndexOf('\n\n', MAX_CHUNK_LENGTH);
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = remaining.lastIndexOf('\n', MAX_CHUNK_LENGTH);
      }
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = MAX_CHUNK_LENGTH;
      }
      chunks.push(remaining.substring(0, splitIdx));
      remaining = remaining.substring(splitIdx).trimStart();
    }

    let lastRes;
    for (const chunk of chunks) {
      lastRes = await sendMessage(chunk, options);
    }
    return lastRes;
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
