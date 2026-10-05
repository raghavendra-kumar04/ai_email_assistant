const { getFormattedISTDate, formatTimeIST } = require('../../utils/dateHelpers');

/**
 * Format Morning Digest message
 */
function formatMorningDigest(stats, emails = []) {
  const dateStr = getFormattedISTDate();

  const importantEmails = emails.filter((e) => e.category === 'important');
  const actionEmails = emails.filter((e) => e.requiresAction || e.category === 'action_required');
  const informationalEmails = emails.filter(
    (e) => e.category === 'informational' && !e.requiresAction
  );

  let message = `📬 *Morning Email Digest* — ${dateStr}\n\n`;

  // Overview Bar
  message += `📊 *Overview*\n`;
  message += `🔴 Important: ${stats.importantCount || importantEmails.length}  |  `;
  message += `🟡 Action Required: ${stats.actionRequiredCount || actionEmails.length}  |  `;
  message += `🟢 Info: ${stats.informationalCount || informationalEmails.length}\n\n`;

  // Important Section
  if (importantEmails.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🔴 *Important Updates*\n`;
    for (const email of importantEmails.slice(0, 5)) {
      message += `• *${email.sender}* — ${email.subject}\n`;
      if (email.summary) {
        message += `  _${email.summary}_\n`;
      }
      if (email.deadline) {
        message += `  ⏰ *Deadline:* ${email.deadline}\n`;
      }
    }
    message += `\n`;
  }

  // Action Required Section
  if (actionEmails.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🟡 *Action Required*\n`;
    for (const email of actionEmails.slice(0, 5)) {
      message += `• *${email.sender}* — ${email.subject}\n`;
      if (email.actionDescription || email.summary) {
        message += `  👉 ${email.actionDescription || email.summary}\n`;
      }
      if (email.deadline) {
        message += `  ⏰ *Due:* ${email.deadline}\n`;
      }
    }
    message += `\n`;
  }

  // Informational Count
  if (informationalEmails.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🟢 *Informational* (${informationalEmails.length} emails)\n`;
    message += `Newsletters, notifications, and general updates — nothing urgent.\n\n`;
  }

  if (emails.length === 0) {
    message += `🎉 *Your inbox is clean!* No unread or new emails detected today.\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💬 _Ask me anything about your emails! (e.g. "Did Amazon send anything today?")_`;

  return message;
}

/**
 * Format immediate alert for Important emails
 */
function formatImportantAlert(email) {
  const timeStr = formatTimeIST(email.receivedAt);

  let message = `🚨 *Important Email Alert*\n\n`;
  message += `👤 *From:* ${email.sender}\n`;
  message += `📌 *Subject:* ${email.subject}\n`;
  if (timeStr) {
    message += `🕒 *Received:* ${timeStr} IST\n`;
  }
  message += `\n📝 *AI Summary:*\n${email.summary || email.snippet}\n`;

  if (email.requiresAction) {
    message += `\n⚡ *Action Needed:* ${email.actionDescription || 'Follow-up required'}\n`;
  }

  if (email.deadline) {
    message += `⏰ *Deadline:* ${email.deadline}\n`;
  }

  return message;
}

/**
 * Format /start message
 */
function formatStartMessage() {
  return `👋 *Hello! I am your AI Email Assistant.*

I monitor your Gmail, deliver intelligent daily digests, detect important emails, and answer your questions naturally.

✨ *What I can do for you:*
• 📬 *Morning Digest:* Sent every morning around 7:30 AM IST.
• 🚨 *Alerts:* Immediate notification for emails classified as *Important*.
• 💬 *Natural Language Chat:* Ask me questions like:
  - _"Did I receive anything from Amazon today?"_
  - _"What emails did I get from college?"_
  - _"Do I have any pending deadlines?"_
  - _"Summarize my recent emails."_

Commands:
/sync - Sync & analyze recent emails from Gmail
/today - Summary of today's emails
/important - List important emails
/summary - Statistical overview of recent inbox activity
/help - Detailed instructions & tips
`;
}

/**
 * Format /help message
 */
function formatHelpMessage() {
  return `📖 *AI Email Assistant — Help & Guide*

🤖 *Natural Language Queries:*
You don't need strict commands! Just type naturally:
• _"Did I receive anything from Amazon today?"_
• _"Show me emails requiring action"_
• _"What deadlines were mentioned?"_
• _"Any emails from my professor or placement cell?"_
• _"Summarize today's emails"_

📋 *Commands:*
• \`/sync\` — Pulls and classifies the latest emails from your Gmail inbox
• \`/today\` — Shows all emails received today
• \`/important\` — Lists all important emails from the last 7 days
• \`/actions\` — Lists pending emails that require your action
• \`/done <keyword>\` — Mark an action item as completed
• \`/reply <keyword>\` — Generate 3 AI reply draft options
• \`/placements\` — Campus & TPO recruitment drive tracker
• \`/weekly\` — Comprehensive 7-day retrospective & upcoming deadlines
• \`/summary\` — Quick statistical & category breakdown
• \`/help\` — Shows this message

🔒 *Privacy & Retention:*
• Application data expires automatically after 7 days (MongoDB TTL).
• Your original Gmail emails are *never* deleted or altered.
• AI only analyzes metadata & snippets for privacy.
`;
}

/**
 * Format Telegram Inline Keyboard with direct action buttons
 */
function formatActionKeyboard(email) {
  if (!email) return undefined;
  const keyboard = [];
  const row1 = [];

  if (email.gmailMessageId) {
    row1.push({
      text: '🔗 Open in Gmail',
      url: `https://mail.google.com/mail/u/0/#inbox/${email.gmailMessageId}`
    });
  }

  if (email.requiresAction && email._id) {
    row1.push({
      text: '✅ Mark Done',
      callback_data: `done:${email._id}`
    });
  }

  if (row1.length > 0) keyboard.push(row1);

  if (email._id) {
    keyboard.push([
      {
        text: '✍️ Draft Quick Reply',
        callback_data: `reply:${email._id}`
      }
    ]);
  }

  return keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined;
}

/**
 * Format Campus & Placement Drive updates
 */
function formatPlacementUpdates(emails = []) {
  if (!emails || emails.length === 0) {
    return '🎓 *Campus & Placement Tracker*\n\n✨ No recent placement or internship emails detected in the last 7 days.';
  }

  let message = `🎓 *Campus & Placement Drive Tracker* (${emails.length} active)\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  emails.forEach((e, idx) => {
    message += `${idx + 1}. *${e.sender}*: ${e.subject}\n`;
    if (e.summary) message += `   📝 _${e.summary}_\n`;
    if (e.actionDescription) message += `   👉 *Action:* ${e.actionDescription}\n`;
    if (e.deadline) message += `   ⏰ *Deadline:* ${e.deadline}\n`;
    message += `\n`;
  });

  message += `💡 _Tip: Tap any email or ask "Summarize placement updates" for details!_`;
  return message;
}

/**
 * Format Weekly Retrospective & Executive Digest
 */
function formatWeeklyDigest(data) {
  let message = `📊 *Weekly Executive Email Digest*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📈 *7-Day Volume Overview*\n`;
  message += `• Total Emails Processed: *${data.totalCount || 0}*\n`;
  message += `• 🔴 Important Flagged: *${data.importantCount || 0}*\n`;
  message += `• 🟡 Action Items Created: *${data.actionRequiredCount || 0}*\n`;
  message += `• ✅ Action Items Resolved: *${data.resolvedActionsCount || 0}*\n\n`;

  if (data.pendingActions && data.pendingActions.length > 0) {
    message += `⏳ *Pending Action Items (${data.pendingActions.length})*\n`;
    data.pendingActions.slice(0, 5).forEach((item, idx) => {
      message += `${idx + 1}. *${item.sender}*: ${item.subject}\n`;
      if (item.deadline) message += `   ⏰ Due: ${item.deadline}\n`;
    });
    message += `\n`;
  } else {
    message += `🎉 *All action items are resolved for the week!*\n\n`;
  }

  if (data.upcomingDeadlines && data.upcomingDeadlines.length > 0) {
    message += `⏰ *Upcoming Deadlines Ahead*\n`;
    data.upcomingDeadlines.forEach((item) => {
      message += `• *${item.deadline}* — ${item.subject} (_${item.sender}_)\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💡 _Have a productive week ahead! Ask me anytime about your emails._`;
  return message;
}

/**
 * Format Hourly Digest for newly arrived emails
 */
function formatHourlyDigest(emails = []) {
  if (!emails || emails.length === 0) {
    return '';
  }

  const timeStr = formatTimeIST(new Date());
  const important = emails.filter((e) => e.category === 'important');
  const actionRequired = emails.filter((e) => e.requiresAction || e.category === 'action_required');
  const informational = emails.filter((e) => e.category === 'informational' && !e.requiresAction);

  let message = `📬 *Hourly Email Digest* (${emails.length} new) — ${timeStr} IST\n\n`;

  if (important.length > 0) {
    message += `🔴 *Important Updates:*\n`;
    for (const email of important) {
      message += `• *${email.sender}*: ${email.subject}\n`;
      if (email.summary) message += `  _${email.summary}_\n`;
      if (email.deadline) message += `  ⏰ *Deadline:* ${email.deadline}\n`;
    }
    message += `\n`;
  }

  if (actionRequired.length > 0) {
    message += `🟡 *Action Needed:*\n`;
    for (const email of actionRequired) {
      message += `• *${email.sender}*: ${email.subject}\n`;
      if (email.actionDescription || email.summary) {
        message += `  👉 ${email.actionDescription || email.summary}\n`;
      }
      if (email.deadline) message += `  ⏰ *Due:* ${email.deadline}\n`;
    }
    message += `\n`;
  }

  if (informational.length > 0) {
    message += `🟢 *Informational Updates:*\n`;
    for (const email of informational.slice(0, 5)) {
      message += `• *${email.sender}*: ${email.subject}\n`;
      if (email.summary) message += `  _${email.summary}_\n`;
    }
    if (informational.length > 5) {
      message += `  _...and ${informational.length - 5} more notifications_\n`;
    }
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💬 _Ask me anytime for details on any of these!_`;

  return message;
}

module.exports = {
  formatMorningDigest,
  formatHourlyDigest,
  formatImportantAlert,
  formatActionKeyboard,
  formatPlacementUpdates,
  formatWeeklyDigest,
  formatStartMessage,
  formatHelpMessage
};

