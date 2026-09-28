const { google } = require('googleapis');
const { createOAuth2Client } = require('./auth');
const logger = require('../../utils/logger');

let cachedGmailClient = null;

/**
 * Gets an authenticated Gmail API client
 */
function getGmailClient() {
  if (!process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error('GMAIL_REFRESH_TOKEN is not configured. Please complete OAuth setup first at /auth/google');
  }

  const auth = createOAuth2Client();
  return google.gmail({ version: 'v1', auth });
}

module.exports = {
  getGmailClient
};
