const { google } = require('googleapis');
const logger = require('../../utils/logger');

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

/**
 * Creates and configures Google OAuth2 client
 */
function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    logger.warn('Google OAuth credentials not fully configured in environment.');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // If refresh token is present in env, set it on the client
  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
  }

  return oauth2Client;
}

/**
 * Generate Google OAuth consent URL
 */
function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Gets refresh_token
    prompt: 'consent',     // Forces consent screen so refresh_token is always returned
    scope: GMAIL_SCOPES
  });
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

module.exports = {
  GMAIL_SCOPES,
  createOAuth2Client,
  getAuthUrl,
  exchangeCodeForTokens
};
