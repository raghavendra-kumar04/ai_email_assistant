const mongoose = require('mongoose');

const digestLogSchema = new mongoose.Schema(
  {
    date: {
      type: String, // format "YYYY-MM-DD" in IST
      required: true,
      unique: true,
      index: true
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    emailCount: {
      type: Number,
      default: 0
    },
    importantCount: {
      type: Number,
      default: 0
    },
    actionRequiredCount: {
      type: Number,
      default: 0
    },
    informationalCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// MongoDB TTL index for DigestLog: 7 days
digestLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

digestLogSchema.pre('validate', function (next) {
  if (!this.expiresAt) {
    const baseDate = this.sentAt || new Date();
    this.expiresAt = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

const DigestLog = mongoose.model('DigestLog', digestLogSchema);

module.exports = DigestLog;
