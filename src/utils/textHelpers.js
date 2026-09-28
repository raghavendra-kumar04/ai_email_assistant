/**
 * Strip HTML tags from a string and convert basic entities
 */
function stripHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text to a given maximum length
 */
function truncateText(text = '', maxLength = 250) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Escape MarkdownV2 characters for safe Telegram messaging
 */
function escapeTelegramMarkdown(text = '') {
  if (!text) return '';
  // Characters that need escaping in Telegram MarkdownV2: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Clean and normalize email subject / sender names
 */
function cleanSender(fromHeader = '') {
  if (!fromHeader) return { name: 'Unknown', email: '' };
  
  // Format: "Sender Name <email@example.com>" or just "email@example.com"
  const match = fromHeader.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
  if (match) {
    const name = match[1]?.trim() || match[2]?.split('@')[0] || 'Unknown';
    const email = match[2]?.trim() || '';
    return { name, email };
  }

  return { name: fromHeader.trim(), email: '' };
}

module.exports = {
  stripHtml,
  truncateText,
  escapeTelegramMarkdown,
  cleanSender
};
