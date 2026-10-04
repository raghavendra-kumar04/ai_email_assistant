const { cleanSender, stripHtml, truncateText } = require('../../utils/textHelpers');

function extractAttachmentFilenames(payload) {
  const filenames = [];
  function traverse(part) {
    if (!part) return;
    if (part.filename && part.filename.trim().length > 0) {
      filenames.push(part.filename.trim());
    }
    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        traverse(subPart);
      }
    }
  }
  traverse(payload);
  return filenames;
}

/**
 * Parse a raw Gmail API message response into a structured email object
 * Note: Keeps data minimal (subject + snippet + attachment names only) per privacy requirements
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
  const attachments = extractAttachmentFilenames(rawMessage.payload);

  return {
    gmailMessageId: id,
    threadId,
    sender: senderName,
    senderEmail,
    subject: subject.trim(),
    snippet: cleanSnippetText,
    attachments,
    receivedAt
  };
}

module.exports = {
  parseGmailMessage
};
