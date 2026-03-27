const router  = require('express').Router();
const Loan    = require('../models/Loan');
const Payment = require('../models/Payment');
const auth    = require('../middleware/auth');

const calc = (amount, interest, weeks) => {
  const intAmt = (amount * interest) / 100;
  const total  = amount + intAmt;
  return { totalAmount: total, weeklyEMI: Math.round((total / weeks) * 100) / 100 };
};

// GET all loans
router.get('/', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ createdBy: req.user.id }).sort({ cardNo: 1 });
    res.json(loans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE loan
router.post('/', auth, async (req, res) => {
  try {
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks } = req.body;

    // Check duplicate active aadhar
    const existing = await Loan.findOne({ aadhar, closed: false, createdBy: req.user.id });
    if (existing) return res.status(400).json({
      message: `Active loan already exists for Aadhar ${aadhar} (${existing.name})`
    });

    // Auto card number
    const last = await Loan.findOne({ createdBy: req.user.id }).sort({ cardNo: -1 });
    const cardNo = (last?.cardNo || 0) + 1;

    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks);
    const loan = await Loan.create({
      cardNo, name, village, aadhar, phone, address,
      amount, interest, startDate, weeks, totalAmount, weeklyEMI,
      createdBy: req.user.id
    });
    res.status(201).json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// UPDATE loan
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks } = req.body;
    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks);
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { name, village, aadhar, phone, address, amount, interest, startDate, weeks, totalAmount, weeklyEMI },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE loan + payments
router.delete('/:id', auth, async (req, res) => {
  try {
    await Payment.deleteMany({ loanId: req.params.id });
    await Loan.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.json({ message: 'Loan deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CLOSE loan
router.patch('/:id/close', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { closed: true }, { new: true }
    );
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// RENEW loan
router.post('/:id/renew', auth, async (req, res) => {
  try {
    await Loan.findOneAndUpdate({ _id: req.params.id }, { closed: true });
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks } = req.body;
    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks);
    const last = await Loan.findOne({ createdBy: req.user.id }).sort({ cardNo: -1 });
    const cardNo = (last?.cardNo || 0) + 1;
    const newLoan = await Loan.create({
      cardNo, name, village, aadhar, phone, address,
      amount, interest, startDate, weeks, totalAmount, weeklyEMI,
      renewedFrom: req.params.id, createdBy: req.user.id
    });
    res.status(201).json(newLoan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
