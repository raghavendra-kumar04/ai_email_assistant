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

const BOT_COMMANDS = [
  { command: 'today', description: "Summary of today's emails" },
  { command: 'important', description: 'List important & high-priority emails' },
  { command: 'actions', description: 'List pending emails requiring action' },
  { command: 'done', description: 'Mark an action item completed (/done <keyword>)' },
  { command: 'reply', description: 'Draft 3 AI reply options (/reply <keyword>)' },
  { command: 'placements', description: 'Campus & TPO placement tracker' },
  { command: 'weekly', description: '7-day retrospective & upcoming deadlines' },
  { command: 'summary', description: 'Overview of recent inbox activity' },
  { command: 'sync', description: 'Sync latest emails from Gmail now' },
  { command: 'help', description: 'Detailed guide & sample questions' }
];

/**
 * Registers bot slash commands with Telegram to enable autocomplete menu when typing '/'
 */
async function registerBotCommands() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await callTelegram('setMyCommands', { commands: BOT_COMMANDS });
    logger.info('📱 Successfully registered Telegram slash commands menu');
  } catch (err) {
    logger.warn({ error: err.message }, 'Could not register Telegram slash commands menu');
  }
}

module.exports = {
  callTelegram,
  registerBotCommands,
  BOT_COMMANDS
};
