const { generateWithFallback } = require('./client');
const logger = require('../../utils/logger');
const { getTodayISTDateString } = require('../../utils/dateHelpers');

const INTENT_SYSTEM_PROMPT = `
You are an intent extraction engine for a personal email assistant Telegram bot.
Today's date is: {{CURRENT_DATE}} (IST).

Your job is to parse the user's natural language question about their emails into structured JSON.

Valid intents:
- "casual_greeting": Conversational hellos, greetings, check-ins (e.g. "hi", "hii", "hello", "hey", "good morning", "what's up").
- "status_inquiry": Progress/status questions (e.g. "what is the status?", "how far the work done?", "any updates?", "is everything working?").
- "search_emails": Search for emails by sender, keyword, or category.
- "summarize": Summarize emails matching criteria.
- "list_important": Specifically looking for important emails.
- "list_actions": Looking for emails requiring action or reply.
- "list_deadlines": Looking for emails mentioning deadlines/due dates.
- "general_question": General chat or question about how the bot works.

CRITICAL RULES:
1. NEVER put greetings ("hi", "hello", "hey") or status words ("status", "work", "progress") into 'filters.keyword'!
2. For "casual_greeting", set fetchUnseenRecent: true.
3. For "status_inquiry", set fetchUnseenRecent: true and wantsBotStatus: true.

Output MUST be valid JSON with this schema:
{
  "intent": "casual_greeting" | "status_inquiry" | "search_emails" | "summarize" | "list_important" | "list_actions" | "list_deadlines" | "general_question",
  "fetchUnseenRecent": boolean,
  "wantsBotStatus": boolean,
  "userIntentExplanation": string,
  "filters": {
    "sender": string | null,        // e.g. "amazon", "college", "vamsi", "placement"
    "keyword": string | null,       // e.g. "project", "assignment", "invoice"
    "timeRange": "today" | "yesterday" | "this_week" | "older_than_7_days" | "all_recent" | null,
    "category": "important" | "action_required" | "informational" | null,
    "requiresActionOnly": boolean | null
  },
  "requiresGmailDirectSearch": boolean,
  "suggestedGmailQuery": string | null
}
`;

async function parseUserIntentWithGemini(userMessage) {
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
    logger.error({ error, userMessage }, 'Failed to parse user intent with Gemini. Using rule-based fallback parser.');
    
    // Smart rule-based fallback
    const lower = userMessage.toLowerCase().trim();

    // Check greetings
    if (/^(hi|hii|hello|hey|hey there|good morning|good evening|what's up|yo|sup)\b/i.test(lower)) {
      return {
        intent: 'casual_greeting',
        fetchUnseenRecent: true,
        wantsBotStatus: false,
        userIntentExplanation: 'User sent a casual greeting and wants latest unseen emails',
        filters: {}
      };
    }

    // Check status inquiry
    if (
      lower.includes('status') ||
      lower.includes('work done') ||
      lower.includes('how far') ||
      lower.includes('progress') ||
      lower.includes('updates') ||
      lower.includes('what happened')
    ) {
      return {
        intent: 'status_inquiry',
        fetchUnseenRecent: true,
        wantsBotStatus: true,
        userIntentExplanation: 'User is asking for bot work status and email updates',
        filters: {}
      };
    }

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
  parseUserIntentWithGemini,
  parseUserIntent: parseUserIntentWithGemini
};
