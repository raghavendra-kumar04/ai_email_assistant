const Email = require('../models/Email');
const {
  formatStartMessage,
  formatHelpMessage,
  formatMorningDigest
} = require('../integrations/telegram/formatter');
const { sendMessage, sendChatAction } = require('../integrations/telegram/sender');
const { searchEmails } = require('../integrations/gmail/fetcher');
const { processEmailBatch } = require('../services/emailProcessor');
const { getStartOfDayUTC, getTodayISTDateString } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

/**
 * Handle Telegram slash commands
 */
async function handleCommand(command, chatId) {
  const cmd = command.toLowerCase().trim();
  logger.info({ command: cmd, chatId }, 'Handling Telegram command');

  await sendChatAction(chatId, 'typing');

  switch (cmd) {
    case '/start': {
      await sendMessage(formatStartMessage(), { chatId });
      break;
    }

    case '/help': {
      await sendMessage(formatHelpMessage(), { chatId });
      break;
    }

    case '/sync': {
      await sendMessage('🔄 Syncing recent emails from your Gmail inbox with AI classification...', { chatId });
      await sendChatAction(chatId, 'typing');

      try {
        const recentEmails = await searchEmails('newer_than:7d', 20);
        const ids = recentEmails.map((e) => e.gmailMessageId);
        
        if (ids.length === 0) {
          await sendMessage('✨ No emails found in the last 7 days.', { chatId });
          break;
        }

        const processed = await processEmailBatch(ids, { shouldNotify: false });
        await sendMessage(
          `✅ Sync complete! Analyzed and indexed *${processed.length}* recent emails in MongoDB.\n\nUse \`/summary\` or \`/important\` to view results.`,
          { chatId }
        );
      } catch (syncErr) {
        logger.error({ syncErr }, 'Error during manual /sync command');
        await sendMessage('⚠️ Encountered an error syncing emails from Gmail. Please try again.', { chatId });
      }
      break;
    }

    case '/today': {
      const todayIST = getTodayISTDateString();
      const startOfToday = getStartOfDayUTC(todayIST);

      let emails = await Email.find({
        receivedAt: { $gte: startOfToday }
      }).sort({ receivedAt: -1 });

      // If no emails in DB yet, fetch today's emails live from Gmail
      if (emails.length === 0) {
        const startSec = Math.floor(startOfToday.getTime() / 1000);
        const todayGmailEmails = await searchEmails(`after:${startSec}`, 15);
        if (todayGmailEmails.length > 0) {
          const ids = todayGmailEmails.map((e) => e.gmailMessageId);
          emails = await processEmailBatch(ids, { shouldNotify: false });
        }
      }

      const stats = {
        importantCount: emails.filter((e) => e.category === 'important').length,
        actionRequiredCount: emails.filter((e) => e.requiresAction).length,
        informationalCount: emails.filter((e) => e.category === 'informational' && !e.requiresAction).length
      };

      const message = formatMorningDigest(stats, emails);
      await sendMessage(message, { chatId });
      break;
    }

    case '/important': {
      let emails = await Email.find({
        category: 'important'
      })
        .sort({ receivedAt: -1 })
        .limit(10);

      // If DB has 0 important emails, do a quick sync of recent emails first
      if (emails.length === 0) {
        const count = await Email.countDocuments();
        if (count === 0) {
          const recent = await searchEmails('newer_than:7d', 15);
          if (recent.length > 0) {
            const ids = recent.map((e) => e.gmailMessageId);
            await processEmailBatch(ids, { shouldNotify: false });
            emails = await Email.find({ category: 'important' }).sort({ receivedAt: -1 }).limit(10);
          }
        }
      }

      if (emails.length === 0) {
        await sendMessage('✨ No important emails detected in the last 7 days.', { chatId });
        break;
      }

      let text = `🚨 *Important Emails (Last 7 Days)*\n\n`;
      for (const e of emails) {
        text += `• *${e.sender}*: ${e.subject}\n`;
        if (e.summary) text += `  _${e.summary}_\n`;
        if (e.deadline) text += `  ⏰ *Deadline:* ${e.deadline}\n`;
        text += `\n`;
      }

      await sendMessage(text, { chatId });
      break;
    }

    case '/summary': {
      let count = await Email.countDocuments();

      // If MongoDB is brand new with 0 records, automatically fetch and ingest recent 7 days of emails
      if (count === 0) {
        await sendMessage('📥 Ingesting and analyzing your recent emails from Gmail...', { chatId });
        await sendChatAction(chatId, 'typing');

        const recent = await searchEmails('newer_than:7d', 15);
        if (recent.length > 0) {
          const ids = recent.map((e) => e.gmailMessageId);
          await processEmailBatch(ids, { shouldNotify: false });
          count = await Email.countDocuments();
        }
      }

      const important = await Email.countDocuments({ category: 'important' });
      const actions = await Email.countDocuments({ requiresAction: true });
      const informational = await Email.countDocuments({ category: 'informational' });

      let text = `📊 *Inbox Activity Summary (Active 7-Day Window)*\n\n`;
      text += `• Total Processed Emails: *${count}*\n`;
      text += `• 🔴 Important Flagged: *${important}*\n`;
      text += `• 🟡 Action Required: *${actions}*\n`;
      text += `• 🟢 Informational: *${informational}*\n\n`;
      text += `💡 _Tip: You can ask specific questions anytime, e.g. "Did college send any notifications today?" or run \`/sync\` to refresh._`;

      await sendMessage(text, { chatId });
      break;
    }

    case '/actions': {
      const actionEmails = await Email.find({ requiresAction: true })
        .sort({ receivedAt: -1 })
        .limit(10);

      if (actionEmails.length === 0) {
        await sendMessage('✨ No pending action items! You are completely caught up.', { chatId });
        break;
      }

      let text = `🟡 *Pending Action Items*\n\n`;
      actionEmails.forEach((e, idx) => {
        text += `${idx + 1}. *${e.sender}*: ${e.subject}\n`;
        if (e.actionDescription) text += `   👉 _${e.actionDescription}_\n`;
        if (e.deadline) text += `   ⏰ *Due:* ${e.deadline}\n`;
        text += `\n`;
      });
      text += `💡 _To mark an item done: \`/done <sender or keyword>\`_`;

      await sendMessage(text, { chatId });
      break;
    }

    default: {
      if (cmd.startsWith('/done')) {
        const query = cmd.replace(/^\/done\s*/, '').trim();
        if (!query) {
          await sendMessage('ℹ️ Please specify which action item to mark done (e.g. `/done Amazon` or `/done electricity bill`).', { chatId });
          break;
        }

        const matched = await Email.findOneAndUpdate(
          {
            requiresAction: true,
            $or: [
              { subject: new RegExp(query, 'i') },
              { sender: new RegExp(query, 'i') },
              { actionDescription: new RegExp(query, 'i') }
            ]
          },
          { $set: { requiresAction: false } },
          { new: true }
        );

        if (matched) {
          await sendMessage(`✅ Marked action item as completed:\n*${matched.sender}* — ${matched.subject}`, { chatId });
        } else {
          await sendMessage(`❓ Could not find a pending action item matching "${query}". Type \`/actions\` to see current pending items.`, { chatId });
        }
        break;
      }

      await sendMessage(
        `❓ Unknown command. Type /help to see all available commands or just ask a question naturally!`,
        { chatId }
      );
    }
  }
}

module.exports = {
  handleCommand
};
