const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    gmailMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    threadId: {
      type: String,
      index: true
    },
    sender: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    snippet: {
      type: String,
      default: ''
    },
    receivedAt: {
      type: Date,
      required: true,
      index: true
    },

    // AI/Gemini Structured Result
    category: {
      type: String,
      enum: ['important', 'action_required', 'informational', 'spam'],
      default: 'informational',
      index: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    summary: {
      type: String,
      default: ''
    },
    requiresAction: {
      type: Boolean,
      default: false,
      index: true
    },
    deadline: {
      type: String, // e.g. "2026-10-01" or null
      default: null
    },
    actionDescription: {
      type: String,
      default: null
    },

    // Processing & Notification State
    processingStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'processed',
      index: true
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    digestIncluded: {
      type: Boolean,
      default: false
    },
    userSeen: {
      type: Boolean,
      default: false,
      index: true
    },
    userSeenAt: {
      type: Date,
      default: null
    },

    // 7-day Retention TTL
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// MongoDB TTL index: automatically deletes document when expiresAt timestamp is reached
emailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook: default expiresAt to receivedAt + 7 days if not provided
emailSchema.pre('validate', function (next) {
  if (!this.expiresAt) {
    const baseDate = this.receivedAt || new Date();
    this.expiresAt = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
