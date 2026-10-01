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
• \`/summary\` — Quick statistical & thematic summary of recent emails
• \`/help\` — Shows this message

🔒 *Privacy & Retention:*
• Application data expires automatically after 7 days (MongoDB TTL).
• Your original Gmail emails are *never* deleted or altered.
• AI only analyzes metadata & snippets for privacy.
`;
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
  formatStartMessage,
  formatHelpMessage
};

