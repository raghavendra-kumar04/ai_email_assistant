const Email = require('../models/Email');
const { parseUserIntent } = require('../integrations/gemini/intentParser');
const { generateQueryAnswer } = require('../integrations/gemini/summarizer');
const { searchEmails } = require('../integrations/gmail/fetcher');
const { getStartOfDayUTC, getTodayISTDateString } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

/**
 * Handle a user's natural language question about their emails
 */
async function handleUserQuery(userQuestion) {
  logger.info({ userQuestion }, 'Processing user natural language query');

  // 1. Parse intent with Gemini
  const intentData = await parseUserIntent(userQuestion);
  const { intent, filters = {}, requiresGmailDirectSearch, suggestedGmailQuery } = intentData;

  logger.debug({ intentData }, 'Parsed user query intent');

  // 2. Build MongoDB query if searching within recent 7-day window
  const mongoQuery = {};

  if (filters.category) {
    mongoQuery.category = filters.category;
  }

  if (filters.requiresActionOnly || intent === 'list_actions') {
    mongoQuery.requiresAction = true;
  }

  if (intent === 'list_deadlines') {
    mongoQuery.deadline = { $ne: null };
  }

  if (filters.sender) {
    mongoQuery.$or = [
      { sender: new RegExp(filters.sender, 'i') },
      { senderEmail: new RegExp(filters.sender, 'i') }
    ];
  }

  if (filters.keyword && !filters.sender) {
    mongoQuery.$or = [
      { subject: new RegExp(filters.keyword, 'i') },
      { snippet: new RegExp(filters.keyword, 'i') },
      { summary: new RegExp(filters.keyword, 'i') },
      { sender: new RegExp(filters.keyword, 'i') }
    ];
  }

  if (filters.timeRange === 'today') {
    const todayIST = getTodayISTDateString();
    const startOfToday = getStartOfDayUTC(todayIST);
    mongoQuery.receivedAt = { $gte: startOfToday };
  } else if (filters.timeRange === 'yesterday') {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mongoQuery.receivedAt = { $gte: yesterday };
  }

  // 3. Search MongoDB first (if connected and query is within 7-day window)
  let matchedEmails = [];
  const isDbConnected = Email.db.readyState === 1;

  if (isDbConnected && !requiresGmailDirectSearch && filters.timeRange !== 'older_than_7_days') {
    try {
      matchedEmails = await Email.find(mongoQuery).sort({ receivedAt: -1 }).limit(15);
    } catch (dbErr) {
      logger.warn({ dbErr: dbErr.message }, 'MongoDB query failed. Falling back to Gmail API search.');
    }
  }

  // 4. If MongoDB is empty or the user asks for older emails / deep inbox search, query Gmail API directly
  if (matchedEmails.length === 0 || requiresGmailDirectSearch || filters.timeRange === 'older_than_7_days') {
    logger.info('Query requires Gmail API direct search. Querying Gmail...');

    let gmailQuery = suggestedGmailQuery;
    if (!gmailQuery) {
      const queryParts = [];
      if (filters.sender) {
        queryParts.push(filters.sender);
      }
      if (filters.keyword && !filters.sender) {
        queryParts.push(filters.keyword);
      }
      if (filters.timeRange === 'today') {
        const todayIST = getTodayISTDateString();
        const start = getStartOfDayUTC(todayIST);
        queryParts.push(`after:${Math.floor(start.getTime() / 1000)}`);
      }
      gmailQuery = queryParts.join(' ') || userQuestion;
    }

    try {
      let gmailResults = await searchEmails(gmailQuery, 10);

      // If sender query with "today" or "from:" yielded 0, retry with just the sender name across the inbox
      if (gmailResults.length === 0 && filters.sender) {
        logger.info(`0 results for "${gmailQuery}". Widening search to sender name "${filters.sender}"...`);
        gmailResults = await searchEmails(filters.sender, 10);
      }

      if (gmailResults.length > 0) {
        matchedEmails = gmailResults;
      }
    } catch (gmailErr) {
      logger.error({ gmailErr }, 'Error querying Gmail directly for user query');
    }
  }

  // 5. Generate conversational synthesis with Gemini
  const answer = await generateQueryAnswer(userQuestion, matchedEmails);
  return answer;
}

module.exports = {
  handleUserQuery
};
