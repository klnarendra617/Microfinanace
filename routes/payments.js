const router  = require('express').Router();
const Payment = require('../models/Payment');
const auth    = require('../middleware/auth');

// Get all payments (optionally filter by loanId or date)
router.get('/', auth, async (req, res) => {
  try {
    const filter = { createdBy: req.user.id };
    if (req.query.loanId) filter.loanId = req.query.loanId;
    if (req.query.date)   filter.payDate = req.query.date;
    const payments = await Payment.find(filter).sort({ payDate: -1, createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add payment
router.post('/', auth, async (req, res) => {
  try {
    const { loanId, amount, payDate, note, paymentMode } = req.body;
    const payment = await Payment.create({ loanId, amount, payDate, note, paymentMode: paymentMode||'Cash', createdBy: req.user.id });
    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update payment
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, payDate, note, paymentMode } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { amount, payDate, note, paymentMode: paymentMode||'Cash' }, { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    res.json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete payment
router.delete('/:id', auth, async (req, res) => {
  try {
    await Payment.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.json({ message: 'Payment deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete all payments for a loan
router.delete('/loan/:loanId', auth, async (req, res) => {
  try {
    await Payment.deleteMany({ loanId: req.params.loanId, createdBy: req.user.id });
    res.json({ message: 'All payments deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
