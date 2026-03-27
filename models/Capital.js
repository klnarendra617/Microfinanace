const mongoose = require('mongoose');

const capitalSchema = new mongoose.Schema({
  amount:    { type: Number, required: true, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Capital', capitalSchema);
