const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  loanId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  amount:    { type: Number, required: true },
  payDate:   { type: String, required: true },
  note:        { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },  // 'Cash' | 'PhonePe' | 'GPay' | 'Paytm' | 'Other UPI'
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
