const express = require('express');
const router = express.Router();
const {
  initiateGoogleAuth,
  handleGoogleCallback
} = require('../controllers/authController');

// Route to start Google OAuth flow
router.get('/google', initiateGoogleAuth);

// Route for OAuth redirect callback
router.get('/google/callback', handleGoogleCallback);

module.exports = router;
