const { runEmailPollJob } = require('./pollJob');
const { runMorningDigestJob } = require('./digestJob');
const logger = require('../utils/logger');

let hourlyPollInterval = null;
let morningDigestInterval = null;

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

  // 3. Morning Digest checker (runs every 10 minutes, triggers at 7:30 AM IST with built-in idempotency)
  morningDigestInterval = setInterval(async () => {
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();

    // Target: Between 7:30 AM and 8:00 AM IST
    if (hours === 7 && minutes >= 30) {
      try {
        await runMorningDigestJob({ force: false });
      } catch (digestErr) {
        logger.error({ digestErr: digestErr.message }, 'Error in scheduled morning digest check');
      }
    }
  }, TEN_MINUTES_MS);

  logger.info('✅ Internal Scheduler running: Hourly Poller (every 60m) + Morning Digest checker active');
}

function stopInternalScheduler() {
  if (hourlyPollInterval) clearInterval(hourlyPollInterval);
  if (morningDigestInterval) clearInterval(morningDigestInterval);
  logger.info('Internal scheduler stopped.');
}

module.exports = {
  startInternalScheduler,
  stopInternalScheduler
};
