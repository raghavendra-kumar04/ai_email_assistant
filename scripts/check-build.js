require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { validateEnv } = require('../src/config/env');
const { stripHtml, truncateText, cleanSender } = require('../src/utils/textHelpers');
const { getTodayISTDateString, getStartOfDayUTC, getFormattedISTDate } = require('../src/utils/dateHelpers');

async function runChecks() {
  console.log('=============================================');
  console.log('🧪 AI EMAIL ASSISTANT — BUILD & DEPLOY CHECKS');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function assert(title, condition, isWarning = false) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else if (isWarning) {
      console.log(`  ⚠️  [WARN] ${title}`);
      warnings++;
    } else {
      console.log(`  ❌ [FAIL] ${title}`);
      failed++;
    }
  }

  // 1. Environment Checks
  console.log('1. Configuration & Environment Validation:');
  const env = validateEnv();

  assert('GOOGLE_CLIENT_ID configured', Boolean(env.GOOGLE_CLIENT_ID));
  assert('GOOGLE_CLIENT_SECRET configured', Boolean(env.GOOGLE_CLIENT_SECRET));
  assert('GOOGLE_REDIRECT_URI configured', Boolean(env.GOOGLE_REDIRECT_URI));
  assert('GEMINI_API_KEY configured', Boolean(env.GEMINI_API_KEY));
  assert('TELEGRAM_BOT_TOKEN configured', Boolean(env.TELEGRAM_BOT_TOKEN));
  assert('TELEGRAM_CHAT_ID configured', Boolean(env.TELEGRAM_CHAT_ID));
  assert('JOB_SECRET configured', Boolean(env.JOB_SECRET));
  assert('TELEGRAM_WEBHOOK_SECRET configured', Boolean(env.TELEGRAM_WEBHOOK_SECRET));
  assert('GROQ_API_KEY configured (sub-second fast intent parsing)', Boolean(env.GROQ_API_KEY), true);

  const isMongoSet = env.MONGODB_URI && !env.MONGODB_URI.includes('<username>') && !env.MONGODB_URI.includes('<password>');
  assert(
    'MONGODB_URI configured with valid credentials',
    isMongoSet,
    true // marked as warning if user hasn't replaced placeholder yet
  );

  assert(
    'GMAIL_REFRESH_TOKEN set (will be populated after visiting /auth/google)',
    Boolean(env.GMAIL_REFRESH_TOKEN),
    true
  );

  // 2. Utility Functions Check
  console.log('\n2. Utility Engine Checks:');
  assert('HTML sanitization works', stripHtml('<b>Test</b>') === 'Test');
  assert('Sender cleaner works', cleanSender('John Doe <john@example.com>').email === 'john@example.com');
  assert('IST Date calculation works', typeof getTodayISTDateString() === 'string' && getTodayISTDateString().length === 10);
  assert('Formatted IST date works', typeof getFormattedISTDate() === 'string');

  // 3. HTTP Endpoints & Middleware Security Checks
  console.log('\n3. HTTP Server, Routes & Security Middleware Checks:');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert('/health returns 200 OK with zero-cost payload', healthRes.status === 200 && healthData.status === 'ok');

    // Root check
    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    assert('Root endpoint / is reachable', rootRes.status === 200 && rootData.status === 'running');

    // OAuth initiation check
    const authRes = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' });
    assert('/auth/google redirects to accounts.google.com', authRes.status === 302 && authRes.headers.get('location')?.includes('accounts.google.com'));

    // Job security check without secret (should be 403 Forbidden)
    const jobUnauthorizedRes = await fetch(`${baseUrl}/jobs/digest`);
    assert('/jobs/digest rejects unauthorized calls with 403 Forbidden', jobUnauthorizedRes.status === 403);

    // Job check with wrong secret
    const jobBadSecretRes = await fetch(`${baseUrl}/jobs/digest`, {
      headers: { 'X-Job-Secret': 'wrong-secret' }
    });
    assert('/jobs/digest rejects invalid X-Job-Secret with 403 Forbidden', jobBadSecretRes.status === 403);

    // Webhook unauthorized chat ID check
    const webhookUnauthorizedRes = await fetch(`${baseUrl}/webhook/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        update_id: 123456,
        message: {
          message_id: 1,
          chat: { id: 999999999 }, // Unauthorized stranger
          text: '/start'
        }
      })
    });
    const webhookUnauthData = await webhookUnauthorizedRes.json();
    assert(
      '/webhook/telegram ignores messages from non-whitelisted Chat IDs',
      webhookUnauthorizedRes.status === 200 && webhookUnauthData.status === 'ignored_unauthorized_user'
    );

    // Webhook authorized chat ID check
    const webhookAuthorizedRes = await fetch(`${baseUrl}/webhook/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        update_id: 123457,
        message: {
          message_id: 2,
          chat: { id: parseInt(process.env.TELEGRAM_CHAT_ID || '0', 10) },
          text: '/help'
        }
      })
    });
    const webhookAuthData = await webhookAuthorizedRes.json();
    assert(
      '/webhook/telegram accepts messages from authorized Chat ID and returns 200 { ok: true } immediately',
      webhookAuthorizedRes.status === 200 && webhookAuthData.ok === true
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  // 4. Summary
  console.log('\n=============================================');
  console.log(`📊 SUMMARY: ${passed} Passed | ${failed} Failed | ${warnings} Warnings`);
  console.log('=============================================');

  if (failed > 0) {
    console.error('\n❌ Some critical build checks failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CORE BUILD & SECURITY CHECKS PASSED!');
    if (warnings > 0) {
      console.log('ℹ️  Action items before production deployment:');
      if (!isMongoSet) console.log('   1. Replace <username> and <password> in MONGODB_URI in your .env');
      if (!env.GMAIL_REFRESH_TOKEN) console.log('   2. Start server (`npm run dev`) and visit http://localhost:3000/auth/google to authorize Gmail and set GMAIL_REFRESH_TOKEN');
    }
  }
}

runChecks().catch((err) => {
  console.error('Fatal check runner error:', err);
  process.exit(1);
});
