const mongoose = require('mongoose');
const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  source: { type: String, enum: SOURCES, default: 'Other' },
  status: { type: String, enum: STATUSES, default: 'New' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
schema.index({ owner: 1, email: 1 }, { unique: true }); // same email allowed for different accounts
schema.index({ status: 1, createdAt: -1 });
module.exports = { Lead: mongoose.model('Lead', schema), STATUSES, SOURCES };
