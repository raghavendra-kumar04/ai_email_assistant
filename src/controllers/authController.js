const {
  createOAuth2Client,
  getAuthUrl,
  exchangeCodeForTokens
} = require('../integrations/gmail/auth');
const logger = require('../utils/logger');

/**
 * Initiates the Google OAuth 2.0 flow
 */
function initiateGoogleAuth(req, res) {
  try {
    const oauth2Client = createOAuth2Client();
    const url = getAuthUrl(oauth2Client);
    res.redirect(url);
  } catch (error) {
    logger.error({ error }, 'Failed to generate Google Auth URL');
    res.status(500).send('Error initiating Google OAuth flow. Please verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }
}

/**
 * Handles Google OAuth 2.0 callback
 */
async function handleGoogleCallback(req, res) {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    logger.warn({ error }, 'Google OAuth authorization was denied or failed');
    return res.status(400).send(`Google OAuth failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code in query string.');
  }

  try {
    const oauth2Client = createOAuth2Client();
    const tokens = await exchangeCodeForTokens(oauth2Client, code);

    logger.info('✅ Google OAuth flow completed successfully!');

    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto;">
            <h2>⚠️ Authorization Successful, but No New Refresh Token Was Returned</h2>
            <p>Google only returns a refresh token on the first consent. If you already authorized earlier, go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a>, remove this app, and try <a href="/auth/google">/auth/google</a> again.</p>
          </body>
        </html>
      `);
    }

    // Render helpful instructions for copying the refresh token into .env or Render dashboard
    return res.send(`
      <html>
        <head>
          <title>OAuth Setup Complete</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; line-height: 1.6; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
            .token-box { background: #020617; border: 1px solid #475569; border-radius: 8px; padding: 1rem; word-break: break-all; font-family: monospace; color: #38bdf8; font-size: 0.95rem; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #166534; color: #4ade80; font-weight: bold; font-size: 0.85rem; }
            button { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; margin-top: 0.5rem; }
            button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <span class="badge">Success</span>
          <h2>🎉 Gmail Authorization Complete!</h2>
          <p>Copy your <code>GMAIL_REFRESH_TOKEN</code> below and add it to your <code>.env</code> file (locally) and your <strong>Render Environment Variables</strong> (in production):</p>
          
          <div class="card">
            <strong>GMAIL_REFRESH_TOKEN</strong>
            <div class="token-box" id="token">${refreshToken}</div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('token').innerText); this.innerText='Copied!';">Copy Token</button>
          </div>

          <p style="margin-top: 1.5rem; color: #94a3b8; font-size: 0.9rem;">
            After adding <code>GMAIL_REFRESH_TOKEN=${refreshToken}</code> to your environment, restart the server. Your AI Email Assistant is ready to read and analyze your emails!
          </p>
        </body>
      </html>
    `);
  } catch (err) {
    logger.error({ err }, 'Error exchanging OAuth code for tokens');
    res.status(500).send('Error completing OAuth token exchange.');
  }
}

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback
};
