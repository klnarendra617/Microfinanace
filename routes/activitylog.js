const router      = require('express').Router();
const ActivityLog = require('../models/ActivityLog');
const auth        = require('../middleware/auth');

// ── GET logs — with optional ?type=&date= filters ──────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const filter = { createdBy: req.user.id };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.date) filter.date = req.query.date;

    const logs = await ActivityLog
      .find(filter)
      .sort({ ts: -1 })
      .limit(2000);   // hard cap — newest first

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST — create a single log entry ───────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { type, action, title, details, changes, user, date, time, ts } = req.body;

    if (!type || !action || !title || !date || !time || !ts) {
      return res.status(400).json({ message: 'Missing required log fields.' });
    }

    const entry = await ActivityLog.create({
      type, action, title,
      details: details || '',
      changes: changes || null,
      user:    user    || '',
      date, time, ts,
      createdBy: req.user.id,
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── No DELETE route — logs are permanent by design ─────────────────────────

module.exports = router;
