const express = require('express');
const router = express.Router();
const validateTelegramWebhook = require('../middleware/validateWebhook');
const { handleTelegramWebhook } = require('../controllers/webhookController');

// Telegram webhook endpoint
router.post('/telegram', validateTelegramWebhook, handleTelegramWebhook);

module.exports = router;
