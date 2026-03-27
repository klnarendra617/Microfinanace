const router  = require('express').Router();
const Capital = require('../models/Capital');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const capital = await Capital.findOne({ updatedBy: req.user.id });
    res.json({ amount: capital?.amount || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const capital = await Capital.findOneAndUpdate(
      { updatedBy: req.user.id },
      { amount: req.body.amount, updatedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json(capital);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
