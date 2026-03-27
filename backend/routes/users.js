const router = require('express').Router();
const User   = require('../models/User');
const auth   = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('username');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add user
router.post('/', auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required.' });
    if (username.length < 3)
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    if (password.length < 4)
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: `Username "${username}" already exists.` });
    const user = await User.create({ username, password });
    res.status(201).json({ _id: user._id, username: user.username });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: "You can't delete your own account." });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
