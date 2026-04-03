const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  cardNo:      { type: Number },
  name:        { type: String, required: true, trim: true },
  village:     { type: String, required: true, trim: true },
  aadhar:      { type: String, default: '' },
  phone:       { type: String, required: true },
  address:     { type: String, default: '' },
  amount:      { type: Number, required: true },
  interest:    { type: Number, required: true },
  startDate:   { type: String, required: true },
  weeks:       { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  weeklyEMI:   { type: Number, required: true },
  closed:      { type: Boolean, default: false },
  renewedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Payment Mode ─────────────────────────────────────
  paymentMode: { type: String, default: 'Cash', enum: ['Cash', 'PhonePe', 'GPay', 'Paytm', 'Other'] },

  // ── Soft delete (Trash) ───────────────────────────────
  // Set when loan is "deleted" — auto hard-deleted after 7 days via cron
  deletedAt: { type: Date, default: null },

  // ── Photos (Cloudinary URLs) ──────────────────
  photos: {
    aadharUrl: { type: String, default: '' },
    personUrl: { type: String, default: '' },
    houseUrl:  { type: String, default: '' },
  },

}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
