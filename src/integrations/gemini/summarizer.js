const { generateWithFallback } = require('./client');
const logger = require('../../utils/logger');

/**
 * Summarizes matched emails using Google Gemini (Google Ecosystem privacy)
 */
async function generateQueryAnswer(userQuestion, emails = []) {
  if (!emails || emails.length === 0) {
    return 'I checked your emails and found no matching messages for your query.';
  }

  const emailContextList = emails
    .slice(0, 10)
    .map((e, index) => {
      return `[Email ${index + 1}]
From: ${e.sender}
Subject: ${e.subject}
Snippet/Summary: ${e.summary || e.snippet || ''}
Received: ${e.receivedAt ? new Date(e.receivedAt).toISOString() : 'Unknown'}
Action Required: ${e.requiresAction ? 'Yes - ' + (e.actionDescription || 'Pending') : 'No'}
Deadline: ${e.deadline || 'None'}
`;
    })
    .join('\n---\n');

  const prompt = `
You are a helpful AI Email Assistant on Telegram.
The user asked: "${userQuestion}"

Here are the relevant email records found (metadata & short snippets only):
---
${emailContextList}
---

INSTRUCTIONS:
1. Answer the user's question directly, clearly, and concisely.
2. Use bullet points if listing multiple items.
3. Highlight any critical deadlines or required actions prominently with emojis (e.g. ⚠️, ⏰, 📌).
4. Keep the tone friendly, professional, and succinct for Telegram messaging.
5. If answering a "Did I receive anything from X?" question, state clearly whether something was received and briefly summarize what it was.
`;

  try {
    const result = await generateWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    return result.response.text().trim();
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate summary with Gemini. Falling back to simple listing.');

    // Fallback simple listing format
    return emails
      .slice(0, 5)
      .map(
        (e) =>
          `• *${e.sender}*: ${e.subject}\n  _${e.summary || e.snippet}_${
            e.deadline ? `\n  ⏰ Deadline: ${e.deadline}` : ''
          }`
      )
      .join('\n\n');
  }
}

/**
 * Generates warm, conversational response for greetings and status inquiries using Google Gemini
 */
async function generateGreetingStatusAnswer({
  userMessage,
  intent,
  unseenEmails = [],
  pendingActionEmails = [],
  botStats = {}
}) {
  const emailContextList = unseenEmails
    .slice(0, 8)
    .map((e, index) => {
      return `[New Email ${index + 1}]
From: ${e.sender}
Subject: ${e.subject}
Summary: ${e.summary || e.snippet || ''}
Received: ${e.receivedAt ? new Date(e.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
Action Required: ${e.requiresAction ? 'Yes - ' + (e.actionDescription || 'Pending') : 'No'}
Deadline: ${e.deadline || 'None'}
`;
    })
    .join('\n---\n');

  const pendingSummary = pendingActionEmails
    .slice(0, 3)
    .map((e) => `• ${e.sender}: ${e.subject} ${e.deadline ? `(Deadline: ${e.deadline})` : ''}`)
    .join('\n');

  const prompt = `
You are a smart, proactive AI Email Assistant on Telegram.
The user just sent this message: "${userMessage}"
Parsed Intent: ${intent}

CONTEXT & CURRENT STATE:
- Newly Fetched / Unseen Emails count: ${unseenEmails.length}
- Total Processed Emails in System: ${botStats.totalProcessed || 0}
- Polling Status: Active (Last synced: ${botStats.lastPollTime || 'just now'})
- Pending Action Items count: ${pendingActionEmails.length}

${unseenEmails.length > 0 ? `NEWLY FETCHED EMAILS TO SUMMARIZE:\n---\n${emailContextList}\n---` : 'NO NEW EMAILS since the user last checked in.'}
${pendingSummary ? `\nPENDING ACTION ITEMS (if user is caught up):\n${pendingSummary}` : ''}

INSTRUCTIONS:
1. Greet the user naturally and warmly in Telegram style.
2. If there are NEWLY FETCHED emails:
   - State how many new emails arrived.
   - Summarize each one concisely (Sender, key takeaway, and any action/deadline).
   - Use bullet points and appropriate emojis (✉️, 🔴, ⏰).
3. If there are NO new emails:
   - State clearly and cheerfully that their inbox is all caught up with no new emails since their last check.
   - Mention that background monitoring is actively running.
   - If there are pending action items, give a quick friendly reminder of what's pending.
   - Ask how you can help them.
4. If the user asked about STATUS / WORK DONE ("What is the status?", "How far the work done?"):
   - Explicitly confirm that email synchronization and AI indexing are operating normally.
   - Give a brief summary of work done (e.g. emails processed, updates detected).
5. Keep it crisp, clean, and conversational. Do NOT output robotic placeholders.
`;

  try {
    const result = await generateWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    return result.response.text().trim();
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate greeting/status answer with Gemini. Using structured template.');

    if (unseenEmails.length > 0) {
      let text = `👋 *Hey! Here are your ${unseenEmails.length} new email updates:*\n\n`;
      for (const e of unseenEmails) {
        text += `• *${e.sender}*: ${e.subject}\n  _${e.summary || e.snippet}_\n`;
        if (e.deadline) text += `  ⏰ *Deadline:* ${e.deadline}\n`;
        text += `\n`;
      }
      text += `_Let me know if you need any details or want me to take action!_`;
      return text;
    }

    if (intent === 'status_inquiry') {
      return `📊 *System & Inbox Status*\n\n• 🟢 *Live Polling:* Active\n• 📬 *New Emails:* 0 unread\n• ⚙️ *Total Processed:* ${botStats.totalProcessed || 0}\n• 📌 *Pending Actions:* ${pendingActionEmails.length}\n\n_All systems running smoothly. How can I assist you right now?_`;
    }

    return `👋 *Hey there!* You're all caught up — no new emails have arrived since your last check.\n\n🟢 Active monitoring is running.\n${pendingActionEmails.length > 0 ? `📌 You have *${pendingActionEmails.length}* pending action item(s).\n\n` : ''}How can I help you today?`;
  }
}

module.exports = {
  generateQueryAnswer,
  generateGreetingStatusAnswer
};
