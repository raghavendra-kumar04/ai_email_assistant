const { getGmailClient } = require('./client');
const { parseGmailMessage } = require('./parser');
const logger = require('../../utils/logger');
const { withRetry } = require('../../utils/retry');

/**
 * Fetch the latest historyId for the user's Gmail account
 */
async function getCurrentHistoryId() {
  const gmail = getGmailClient();
  const profile = await withRetry(
    () => gmail.users.getProfile({ userId: 'me' }),
    { context: 'Gmail getProfile' }
  );
  return profile.data.historyId;
}

/**
 * Fetch a single email by ID (metadata + snippet only)
 */
async function fetchEmailById(messageId) {
  const gmail = getGmailClient();
  try {
    const res = await withRetry(
      () =>
        gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date']
        }),
      { context: `Fetch email ${messageId}` }
    );

    return parseGmailMessage(res.data);
  } catch (err) {
    const status = err.status || err.response?.status || err.code;
    if (status === 404) {
      logger.warn({ messageId }, 'Email not found in Gmail (likely deleted/trashed). Skipping.');
    } else {
      logger.error({ err, messageId }, 'Failed to fetch email by ID');
    }
    return null;
  }
}

/**
 * Search emails by Gmail query string (e.g. "after:1727481600", "from:amazon", "vamsi")
 */
async function searchEmails(query, maxResults = 25) {
  const gmail = getGmailClient();

  let listRes = await withRetry(
    () =>
      gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      }),
    { context: `Gmail search query: ${query}` }
  );

  let messages = listRes.data.messages || [];

  // If a specific "from:..." query yielded 0 results, try a broader keyword search
  if (messages.length === 0 && query.startsWith('from:')) {
    const rawKeyword = query.replace(/^from:/, '').replace(/["']/g, '').trim();
    logger.info({ rawKeyword }, '0 results for from: query. Retrying with broad keyword search...');
    
    listRes = await withRetry(
      () =>
        gmail.users.messages.list({
          userId: 'me',
          q: rawKeyword,
          maxResults
        }),
      { context: `Gmail search fallback: ${rawKeyword}` }
    );
    messages = listRes.data.messages || [];
  }

  if (messages.length === 0) {
    return [];
  }

  // Fetch metadata for each message concurrently with a limit
  const fetchPromises = messages.slice(0, 10).map((m) => fetchEmailById(m.id));
  const results = await Promise.all(fetchPromises);

  return results.filter(Boolean);
}

/**
 * Fetch changes since lastHistoryId using history.list
 */
async function fetchHistoryChanges(startHistoryId) {
  const gmail = getGmailClient();

  try {
    const res = await withRetry(
      () =>
        gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          historyTypes: ['messageAdded']
        }),
      { context: 'Gmail history list' }
    );

    const historyItems = res.data.history || [];
    const newMessageIds = new Set();

    for (const item of historyItems) {
      if (item.messagesAdded) {
        for (const added of item.messagesAdded) {
          if (added.message && added.message.id) {
            newMessageIds.add(added.message.id);
          }
        }
      }
    }

    return {
      messageIds: Array.from(newMessageIds),
      latestHistoryId: res.data.historyId || startHistoryId
    };
  } catch (error) {
    // If startHistoryId is too old or invalid (Gmail error 404), signal caller to reset
    if (error.code === 404 || error.status === 404) {
      logger.warn('Gmail startHistoryId is invalid or expired. Resetting history pointer.');
      const freshHistoryId = await getCurrentHistoryId();
      return {
        messageIds: [],
        latestHistoryId: freshHistoryId,
        wasReset: true
      };
    }
    throw error;
  }
}

module.exports = {
  getCurrentHistoryId,
  fetchEmailById,
  searchEmails,
  fetchHistoryChanges
};
