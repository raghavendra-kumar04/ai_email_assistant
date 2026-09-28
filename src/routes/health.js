const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 * CRITICAL: Must remain zero-cost (no DB queries, no Gmail, no Gemini calls).
 * Used by Render health monitoring and 10-minute keep-alive cron pings.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
