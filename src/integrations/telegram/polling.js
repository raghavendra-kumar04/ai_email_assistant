const axios = require('axios');
const logger = require('../../utils/logger');
const { handleCommand } = require('../../controllers/commandHandler');
const { handleNaturalLanguageQuery } = require('../../controllers/intentHandler');

let isPolling = false;
let offset = 0;

/**
 * Starts long-polling for local development so Telegram messages work on localhost
 * without needing ngrok or a public domain.
 */
async function startDevPolling() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not configured. Polling not started.');
    return;
  }

  isPolling = true;
  logger.info('🤖 Starting Telegram local dev polling worker...');

  // Delete any lingering webhook to allow getUpdates
  try {
    await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      drop_pending_updates: false
    });
  } catch (err) {
    // ignore
  }

  pollLoop();
}

async function pollLoop() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const authorizedChatId = String(process.env.TELEGRAM_CHAT_ID || '');

  while (isPolling) {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
        params: {
          offset,
          timeout: 25
        },
        timeout: 30000
      });

      const updates = response.data.result || [];

      for (const update of updates) {
        offset = update.update_id + 1;

        const message = update.message || update.edited_message;
        if (!message || !message.text) continue;

        const senderChatId = String(message.chat.id);
        const text = message.text.trim();

        if (authorizedChatId && senderChatId !== authorizedChatId) {
          logger.warn(`🚫 Unauthorized chat ID (${senderChatId}) ignored in polling.`);
          continue;
        }

        logger.info({ text, chatId: senderChatId }, '📩 Received message via dev poller');

        // Dispatch command or natural language handler
        try {
          if (text.startsWith('/')) {
            await handleCommand(text, senderChatId);
          } else {
            await handleNaturalLanguageQuery(text, senderChatId);
          }
        } catch (dispatchErr) {
          logger.error({ dispatchErr, text }, 'Error processing Telegram message');
        }
      }
    } catch (error) {
      if (!isPolling) break;
      // If network glitch or timeout, wait briefly before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

function stopDevPolling() {
  isPolling = false;
  logger.info('Telegram dev polling stopped.');
}

module.exports = {
  startDevPolling,
  stopDevPolling
};
