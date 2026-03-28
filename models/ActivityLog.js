const mongoose = require('mongoose');

const changeSchema = new mongoose.Schema({
  field:  { type: String },
  old:    { type: String },
  newVal: { type: String },
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  type:    { type: String, required: true },   // 'loan' | 'payment' | 'expense' | 'capital' | 'session'
  action:  { type: String, required: true },   // 'add' | 'edit' | 'delete' | 'close' | 'renew' | 'set' | 'login' | 'logout'
  title:   { type: String, required: true },
  details: { type: String, default: '' },
  changes: { type: [changeSchema], default: null },
  user:    { type: String, default: '' },
  date:    { type: String, required: true },   // 'YYYY-MM-DD'
  time:    { type: String, required: true },   // 'HH:MM:SS'
  ts:      { type: Number, required: true },   // Unix ms timestamp
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Index for fast queries — newest first per user
activityLogSchema.index({ createdBy: 1, ts: -1 });
activityLogSchema.index({ createdBy: 1, date: -1 });
activityLogSchema.index({ createdBy: 1, type: 1, ts: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
