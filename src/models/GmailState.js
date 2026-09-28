const mongoose = require('mongoose');

const gmailStateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'singleton'
    },
    lastHistoryId: {
      type: String,
      default: null
    },
    lastPollAt: {
      type: Date,
      default: null
    },
    lastSuccessfulPollAt: {
      type: Date,
      default: null
    },
    totalEmailsProcessed: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Helper static to get or create singleton state
gmailStateSchema.statics.getState = async function () {
  let state = await this.findById('singleton');
  if (!state) {
    state = await this.create({ _id: 'singleton' });
  }
  return state;
};

const GmailState = mongoose.model('GmailState', gmailStateSchema);

module.exports = GmailState;
