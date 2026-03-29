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

  // ── Photos (Cloudinary URLs) ──────────────────
  photos: {
    aadharUrl: { type: String, default: '' },
    personUrl: { type: String, default: '' },
    houseUrl:  { type: String, default: '' },
  },

}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
