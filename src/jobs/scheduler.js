const { runEmailPollJob } = require('./pollJob');
const { runMorningDigestJob } = require('./digestJob');
const { getWeeklyDigestData } = require('../services/weeklyService');
const { formatWeeklyDigest } = require('../integrations/telegram/formatter');
const { sendMessage } = require('../integrations/telegram/sender');
const logger = require('../utils/logger');

let hourlyPollInterval = null;
let digestInterval = null;
let lastWeeklyDigestDate = null;

const ONE_HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Starts the internal background scheduler inside Node.js
 */
function startInternalScheduler() {
  logger.info('⏰ Starting Internal Node.js Hourly Scheduler...');

  // 1. Initial warm-up baseline sync 5 seconds after boot
  setTimeout(async () => {
    logger.info('🚀 Running initial baseline email sync after startup...');
    try {
      await runEmailPollJob({ sendHourlySummary: false });
    } catch (err) {
      logger.warn({ error: err.message }, 'Initial startup email sync encountered an issue. Will retry on next hourly interval.');
    }
  }, 5000);

  // 2. Periodic 1-Hour Email Poller & Hourly Summary Dispatcher
  hourlyPollInterval = setInterval(async () => {
    logger.info('⏰ Internal Timer: Triggering 1-hour email poll and digest check...');
    try {
      await runEmailPollJob({ sendHourlySummary: true });
    } catch (err) {
      logger.error({ error: err.message }, 'Error during scheduled 1-hour email polling');
    }
  }, ONE_HOUR_MS);

  // 3. Digest checker (Morning 7:30 AM IST + Sunday 8:00 PM IST Weekly Digest)
  digestInterval = setInterval(async () => {
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const dayOfWeek = istDate.getUTCDay(); // 0 = Sunday
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const todayStr = istDate.toISOString().slice(0, 10);

    // Target 1: Daily Morning Digest between 7:30 AM and 8:00 AM IST
    if (hours === 7 && minutes >= 30) {
      try {
        await runMorningDigestJob({ force: false });
      } catch (digestErr) {
        logger.error({ digestErr: digestErr.message }, 'Error in scheduled morning digest check');
      }
    }

    // Target 2: Sunday Weekly Digest at 8:00 PM IST (20:00 - 20:30 IST)
    if (dayOfWeek === 0 && hours === 20 && minutes <= 30 && lastWeeklyDigestDate !== todayStr) {
      try {
        logger.info('⏰ Triggering scheduled Sunday Weekly Digest...');
        const weeklyData = await getWeeklyDigestData();
        const formatted = formatWeeklyDigest(weeklyData);
        await sendMessage(formatted);
        lastWeeklyDigestDate = todayStr;
        logger.info('📬 Successfully delivered Sunday Weekly Digest to Telegram');
      } catch (weeklyErr) {
        logger.error({ weeklyErr: weeklyErr.message }, 'Error in scheduled Sunday weekly digest check');
      }
    }
  }, TEN_MINUTES_MS);

  logger.info('✅ Internal Scheduler running: Hourly Poller (every 60m) + Morning Digest (7:30 AM) + Sunday Weekly Digest (8:00 PM)');
}

function stopInternalScheduler() {
  if (hourlyPollInterval) clearInterval(hourlyPollInterval);
  if (digestInterval) clearInterval(digestInterval);
  logger.info('Internal scheduler stopped.');
}

module.exports = {
  startInternalScheduler,
  stopInternalScheduler
};
