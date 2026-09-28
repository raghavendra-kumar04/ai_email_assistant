const { handleUserQuery } = require('../services/queryService');
const { sendMessage, sendChatAction } = require('../integrations/telegram/sender');
const logger = require('../utils/logger');

/**
 * Handle natural language questions received from Telegram
 */
async function handleNaturalLanguageQuery(userText, chatId) {
  logger.info({ userText, chatId }, 'Handling natural language query');

  try {
    // Send typing action so the user sees the bot is working
    await sendChatAction(chatId, 'typing');

    const answer = await handleUserQuery(userText);
    await sendMessage(answer, { chatId });
  } catch (error) {
    logger.error({ error, userText }, 'Error answering user natural language query');
    await sendMessage(
      '⚠️ Sorry, I encountered an issue searching and analyzing your emails. Please try again or rephrase your question.',
      { chatId }
    );
  }
}

module.exports = {
  handleNaturalLanguageQuery
};
