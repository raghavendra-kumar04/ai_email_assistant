const { cleanSender, stripHtml, truncateText } = require('../../utils/textHelpers');

/**
 * Parse a raw Gmail API message response into a structured email object
 * Note: Keeps data minimal (subject + snippet only) per architectural privacy requirements
 */
function parseGmailMessage(rawMessage) {
  if (!rawMessage || !rawMessage.payload) {
    return null;
  }

  const { id, threadId, internalDate, snippet } = rawMessage;
  const headers = rawMessage.payload.headers || [];

  let subject = '(No Subject)';
  let from = 'Unknown';
  let dateHeader = null;

  for (const header of headers) {
    const name = header.name.toLowerCase();
    if (name === 'subject') {
      subject = header.value;
    } else if (name === 'from') {
      from = header.value;
    } else if (name === 'date') {
      dateHeader = header.value;
    }
  }

  const { name: senderName, email: senderEmail } = cleanSender(from);

  let receivedAt = new Date();
  if (internalDate) {
    receivedAt = new Date(parseInt(internalDate, 10));
  } else if (dateHeader) {
    receivedAt = new Date(dateHeader);
  }

  // Clean snippet: truncate and strip any stray HTML entities
  const cleanSnippetText = truncateText(stripHtml(snippet || ''), 250);

  return {
    gmailMessageId: id,
    threadId,
    sender: senderName,
    senderEmail,
    subject: subject.trim(),
    snippet: cleanSnippetText,
    receivedAt
  };
}

module.exports = {
  parseGmailMessage
};
