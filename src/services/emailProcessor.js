const Email = require('../models/Email');
const { fetchEmailById } = require('../integrations/gmail/fetcher');
const { classifyEmail } = require('../integrations/gemini/classifier');
const { notifyIfImportant } = require('./notificationService');
const logger = require('../utils/logger');
const { sleep } = require('../utils/retry');

/**
 * Process a single email by its Gmail Message ID
 */
async function processEmail(messageId, options = {}) {
  const { shouldNotify = true } = options;

  // 1. Check idempotency: already in MongoDB?
  const existing = await Email.findOne({ gmailMessageId: messageId });
  if (existing) {
    logger.debug({ messageId }, 'Email already processed. Skipping.');
    return existing;
  }

  // 2. Fetch email metadata & snippet from Gmail API
  const emailData = await fetchEmailById(messageId);
  if (!emailData) {
    logger.warn({ messageId }, 'Unable to fetch email metadata from Gmail.');
    return null;
  }

  // 3. Classify with Gemini (subject + snippet only)
  const classification = await classifyEmail(emailData);

  // 4. Store in MongoDB with 7-day TTL (expiresAt handled by schema hook)
  const emailDoc = new Email({
    gmailMessageId: emailData.gmailMessageId,
    threadId: emailData.threadId,
    sender: emailData.sender,
    senderEmail: emailData.senderEmail,
    subject: emailData.subject,
    snippet: emailData.snippet,
    receivedAt: emailData.receivedAt,
    category: classification.category,
    priority: classification.priority,
    summary: classification.summary,
    requiresAction: classification.requiresAction,
    deadline: classification.deadline,
    actionDescription: classification.actionDescription,
    processingStatus: 'processed',
    notificationSent: false
  });

  await emailDoc.save();
  logger.info(
    {
      messageId,
      category: classification.category,
      subject: emailData.subject
    },
    'Email processed & classified'
  );

  // 5. Send immediate notification if important or high-priority action required
  const isUrgent = classification.category === 'important' || (classification.requiresAction && classification.priority === 'high');
  if (shouldNotify && isUrgent) {
    await notifyIfImportant(emailDoc);
  }

  return emailDoc;
}

/**
 * Process a batch of email message IDs sequentially with throttling to respect free tier RPM
 */
async function processEmailBatch(messageIds = [], options = {}) {
  const results = [];
  
  for (const messageId of messageIds) {
    try {
      const doc = await processEmail(messageId, options);
      if (doc) results.push(doc);
      // Small 300ms pause to avoid bursting Gemini rate limit
      await sleep(300);
    } catch (err) {
      logger.error({ err, messageId }, 'Error in batch processing of email');
    }
  }

  return results;
}

module.exports = {
  processEmail,
  processEmailBatch
};
