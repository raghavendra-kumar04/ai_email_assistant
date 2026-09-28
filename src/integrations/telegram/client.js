const axios = require('axios');
const logger = require('../../utils/logger');
const { withRetry } = require('../../utils/retry');

const BASE_URL = 'https://api.telegram.org/bot';

/**
 * Make an HTTP POST call to Telegram Bot API
 */
async function callTelegram(method, data = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  const url = `${BASE_URL}${token}/${method}`;

  return withRetry(
    async () => {
      const response = await axios.post(url, data, {
        timeout: 10000
      });
      return response.data;
    },
    { context: `Telegram API: ${method}` }
  );
}

module.exports = {
  callTelegram
};
