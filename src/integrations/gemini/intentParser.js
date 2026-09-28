const { generateWithFallback } = require('./client');
const logger = require('../../utils/logger');
const { getTodayISTDateString } = require('../../utils/dateHelpers');

const INTENT_SYSTEM_PROMPT = `
You are an intent extraction engine for a personal email assistant Telegram bot.
Today's date is: {{CURRENT_DATE}} (IST).

Your job is to parse the user's natural language question about their emails into structured JSON.

Valid intents:
- "search_emails": Search for emails by sender, keyword, or category.
- "summarize": Summarize emails matching criteria.
- "list_important": Specifically looking for important emails.
- "list_actions": Looking for emails requiring action or reply.
- "list_deadlines": Looking for emails mentioning deadlines/due dates.
- "general_question": General chat or question about how the bot works.

Output MUST be valid JSON with this schema:
{
  "intent": "search_emails" | "summarize" | "list_important" | "list_actions" | "list_deadlines" | "general_question",
  "filters": {
    "sender": string | null,        // e.g. "amazon", "college", "vamsi", "placement"
    "keyword": string | null,       // e.g. "project", "assignment", "invoice"
    "timeRange": "today" | "yesterday" | "this_week" | "older_than_7_days" | "all_recent" | null,
    "category": "important" | "action_required" | "informational" | null,
    "requiresActionOnly": boolean | null
  },
  "requiresGmailDirectSearch": boolean, // true if user asks for emails > 7 days ago or specific deep inbox searches
  "suggestedGmailQuery": string | null  // e.g. "from:amazon", "college", "after:2026/09/20"
}
`;

async function parseUserIntent(userMessage) {
  const today = getTodayISTDateString();
  const systemPrompt = INTENT_SYSTEM_PROMPT.replace('{{CURRENT_DATE}}', today);

  const prompt = `
${systemPrompt}

USER QUERY: "${userMessage}"

Return ONLY the JSON object.
`;

  try {
    const result = await generateWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error) {
    logger.error({ error, userMessage }, 'Failed to parse user intent with Gemini. Using fallback parser.');
    
    // Smart rule-based fallback when Gemini API encounters temporary 503 spikes
    const lower = userMessage.toLowerCase();
    let sender = null;
    let keyword = null;

    const senderMatch = lower.match(/(?:from|by|sent by)\s+([a-zA-Z0-9_\s]+?)(?:\s+(?:today|yesterday|this week)|$|\?)/i);
    if (senderMatch) {
      sender = senderMatch[1].trim();
    }

    if (lower.includes('important')) {
      return { intent: 'list_important', filters: { category: 'important', sender } };
    }
    if (lower.includes('action') || lower.includes('reply')) {
      return { intent: 'list_actions', filters: { requiresActionOnly: true, sender } };
    }
    if (lower.includes('deadline') || lower.includes('due')) {
      return { intent: 'list_deadlines', filters: { sender } };
    }
    if (lower.includes('summarize') || lower.includes('summary')) {
      return { intent: 'summarize', filters: { sender, keyword } };
    }

    return {
      intent: 'search_emails',
      filters: { sender, keyword: sender ? null : userMessage, timeRange: lower.includes('today') ? 'today' : 'all_recent' },
      requiresGmailDirectSearch: Boolean(sender)
    };
  }
}

module.exports = {
  parseUserIntent
};
