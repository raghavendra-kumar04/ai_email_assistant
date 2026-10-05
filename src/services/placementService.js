const Email = require('../models/Email');
const { searchEmails } = require('../integrations/gmail/fetcher');
const logger = require('../utils/logger');

/**
 * Fetch and aggregate recent Campus & Placement Drive emails
 */
async function getPlacementUpdates() {
  const placementRegex = /(placement|tpo|campus|recruitment|drive|interview|internship|hiring|job offer|vignan|vlits|lara)/i;

  let emails = await Email.find({
    $or: [
      { subject: placementRegex },
      { sender: placementRegex },
      { summary: placementRegex },
      { snippet: placementRegex }
    ]
  })
    .sort({ receivedAt: -1 })
    .limit(10);

  if (emails.length === 0) {
    try {
      const liveResults = await searchEmails('("placement" OR "TPO" OR "drive" OR "internship" OR "recruitment") (from:vignan OR from:vlits OR from:lara OR TPO)', 10);
      if (liveResults.length > 0) {
        emails = liveResults;
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed live Gmail placement search fallback');
    }
  }

  return emails;
}

module.exports = {
  getPlacementUpdates
};
