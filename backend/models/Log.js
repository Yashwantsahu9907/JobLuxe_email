const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  campaignId: { type: String, required: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['success', 'failed'], required: true },
  errorMsg: { type: String },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);
