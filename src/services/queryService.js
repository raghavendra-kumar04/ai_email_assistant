const Email = require('../models/Email');
const GmailState = require('../models/GmailState');
const { parseUserIntentWithGroq } = require('../integrations/groq/intentParser');
const { generateQueryAnswer, generateGreetingStatusAnswer } = require('../integrations/gemini/summarizer');
const { searchEmails } = require('../integrations/gmail/fetcher');
const { getStartOfDayUTC, getTodayISTDateString } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

/**
 * Handle a user's natural language question or greeting/status check about their emails
 */
async function handleUserQuery(userQuestion) {
  logger.info({ userQuestion }, 'Processing user natural language query');

  // 1. Parse intent with Groq (with automatic Gemini fallback)
  const intentData = await parseUserIntentWithGroq(userQuestion);
  const {
    intent,
    fetchUnseenRecent = false,
    wantsBotStatus = false,
    filters = {},
    requiresGmailDirectSearch,
    suggestedGmailQuery
  } = intentData;

  logger.info(
    {
      intent,
      fetchUnseenRecent,
      wantsBotStatus,
      filters
    },
    'Parsed user query intent successfully'
  );

  // 2. Handle Casual Greetings & Status Inquiries (Summary of newly fetched emails only)
  if (intent === 'casual_greeting' || intent === 'status_inquiry' || fetchUnseenRecent) {
    logger.info(`Handling ${intent} workflow: fetching unseen/newly fetched emails...`);

    const state = await GmailState.getState();

    // Query unviewed emails
    const unseenEmails = await Email.find({
      userSeen: false
    })
      .sort({ receivedAt: -1 })
      .limit(10);

    // Query any pending action items (if user is caught up, show quick action reminder)
    const pendingActionEmails = await Email.find({
      requiresAction: true
    })
      .sort({ receivedAt: -1 })
      .limit(5);

    const botStats = {
      totalProcessed: state.totalEmailsProcessed || 0,
      lastPollTime: state.lastSuccessfulPollAt
        ? new Date(state.lastSuccessfulPollAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Active'
    };

    // Generate warm greeting / status answer
    const answer = await generateGreetingStatusAnswer({
      userMessage: userQuestion,
      intent,
      unseenEmails,
      pendingActionEmails,
      botStats
    });

    // Mark the presented emails as seen so they are NOT repeated on the next "Hi"
    if (unseenEmails.length > 0) {
      const unseenIds = unseenEmails.map((e) => e._id);
      await Email.updateMany(
        { _id: { $in: unseenIds } },
        { $set: { userSeen: true, userSeenAt: new Date() } }
      );
    }

    // Update conversation tracking timestamp in GmailState
    state.lastUserInteractionAt = new Date();
    state.lastUserGreetingAt = new Date();
    await state.save();

    return answer;
  }

  // 3. Build MongoDB query for specific search intents
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

  // 4. Search MongoDB first (if connected and query is within 7-day window)
  let matchedEmails = [];
  const isDbConnected = Email.db.readyState === 1;

  if (isDbConnected && !requiresGmailDirectSearch && filters.timeRange !== 'older_than_7_days') {
    try {
      matchedEmails = await Email.find(mongoQuery).sort({ receivedAt: -1 }).limit(15);
    } catch (dbErr) {
      logger.warn({ dbErr: dbErr.message }, 'MongoDB query failed. Falling back to Gmail API search.');
    }
  }

  // 5. If MongoDB is empty or the user asks for older emails / deep inbox search, query Gmail API directly
  if (matchedEmails.length === 0 || requiresGmailDirectSearch || filters.timeRange === 'older_than_7_days') {
    logger.info('Query requires Gmail API direct search. Querying Gmail...');

    let gmailQuery = suggestedGmailQuery;
    if (!gmailQuery) {
      const queryParts = [];
      if (filters.sender) {
        queryParts.push(`from:${filters.sender}`);
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

      // If sender query with "from:" or filters yielded 0, retry with just the sender name across the inbox
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

  // 6. Generate conversational synthesis with Gemini
  const answer = await generateQueryAnswer(userQuestion, matchedEmails);

  // Mark retrieved emails as seen
  if (matchedEmails.length > 0 && isDbConnected) {
    const ids = matchedEmails.map((e) => e._id).filter(Boolean);
    if (ids.length > 0) {
      await Email.updateMany({ _id: { $in: ids } }, { $set: { userSeen: true, userSeenAt: new Date() } });
    }
  }

  return answer;
}

module.exports = {
  handleUserQuery
};
