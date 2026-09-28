const { generateWithFallback } = require('./client');
const logger = require('../../utils/logger');

/**
 * Summarizes matched emails to answer the user's natural language question
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
        maxOutputTokens: 500
      }
    });

    return result.response.text().trim();
  } catch (error) {
    logger.error({ error }, 'Failed to generate summary with Gemini. Falling back to simple listing.');

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

module.exports = {
  generateQueryAnswer
};
