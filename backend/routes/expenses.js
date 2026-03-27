const router  = require('express').Router();
const Expense = require('../models/Expense');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ createdBy: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { date, category, description, amount, paidBy } = req.body;
    const expense = await Expense.create({ date, category, description, amount, paidBy, createdBy: req.user.id });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { date, category, description, amount, paidBy } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { date, category, description, amount, paidBy }, { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.json({ message: 'Expense deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
