const Email = require('../models/Email');
const { callTelegram } = require('../integrations/telegram/client');
const { sendMessage, sendChatAction } = require('../integrations/telegram/sender');
const { generateReplyDrafts } = require('../services/replyService');
const logger = require('../utils/logger');

/**
 * Handles Telegram Inline Keyboard button clicks (callback_query)
 */
async function handleCallbackQuery(callbackQuery) {
  const { id: callbackId, data, from, message } = callbackQuery;
  const chatId = message?.chat?.id || from?.id;

  logger.info({ data, chatId }, 'Handling Telegram callback button interaction');

  try {
    // 1. Always answer callback query immediately to dismiss loading state in Telegram UI
    await callTelegram('answerCallbackQuery', {
      callback_query_id: callbackId,
      text: 'Processing...'
    });

    if (!data) return;

    // 2. Handle "done:<emailId>"
    if (data.startsWith('done:')) {
      const emailId = data.replace('done:', '').trim();
      const updated = await Email.findByIdAndUpdate(
        emailId,
        { $set: { requiresAction: false } },
        { new: true }
      );

      if (updated) {
        await sendMessage(
          `✅ *Action Completed!*\n\n*${updated.sender}* — ${updated.subject}\n_Item marked as resolved in your database._`,
          { chatId }
        );
      } else {
        await sendMessage('ℹ️ Action item already completed or not found.', { chatId });
      }
      return;
    }

    // 3. Handle "reply:<emailId>"
    if (data.startsWith('reply:')) {
      const emailId = data.replace('reply:', '').trim();
      const emailDoc = await Email.findById(emailId);

      if (!emailDoc) {
        await sendMessage('ℹ️ Email details not found or expired.', { chatId });
        return;
      }

      await sendChatAction(chatId, 'typing');
      await sendMessage(`✍️ *Drafting quick replies for:* "${emailDoc.subject}"...`, { chatId });

      const drafts = await generateReplyDrafts(emailDoc);
      let replyMessage = `📬 *AI Reply Suggestions for:* _${emailDoc.subject}_\n*To:* ${emailDoc.sender}\n\n`;

      drafts.forEach((draft, idx) => {
        replyMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
        replyMessage += `*${draft.label || `Option ${idx + 1}`}*\n\`\`\`text\n${draft.text}\n\`\`\`\n\n`;
      });

      replyMessage += `💡 _Tap any block to copy, then paste directly into Gmail!_`;

      await sendMessage(replyMessage, { chatId });
      return;
    }
  } catch (error) {
    logger.error({ error: error.message, callbackId }, 'Error handling Telegram callback button query');
  }
}

module.exports = {
  handleCallbackQuery
};
