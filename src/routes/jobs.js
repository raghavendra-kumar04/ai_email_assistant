const express = require('express');
const router = express.Router();
const validateJobSecret = require('../middleware/validateJobSecret');
const {
  triggerDigestJob,
  triggerPollJob
} = require('../controllers/jobController');

// All job endpoints are protected with validateJobSecret (X-Job-Secret header)
router.use(validateJobSecret);

// Morning digest trigger (scheduled for ~7:30 AM IST)
router.get('/digest', triggerDigestJob);

// Periodic email polling trigger (scheduled hourly)
router.get('/poll-emails', triggerPollJob);

module.exports = router;
