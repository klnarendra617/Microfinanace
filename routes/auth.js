const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Token
const sign = (user) => jwt.sign(
  { id: user._id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);


// 🔐 LOGIN
router.post('/login', async (req, res) => {
  console.log("login hit")
  try {
    const { username, password } = req.body;
    console.log(username)

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required.' });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ message: 'User not found.' });

    // Blocked user check
    if (!user.isAllowed)
      return res.status(403).json({ message: 'Access denied.' });

    const match = await user.matchPassword(password);
    console.log("Entered password:", password);
    console.log("Stored hash:", user.password);


    console.log("Password match:", match);
    if (!match)
      return res.status(401).json({ message: 'Incorrect password.' });

    res.json({
      token: sign(user),
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔐 CHANGE PASSWORD (user only)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!await user.matchPassword(currentPassword))
      return res.status(401).json({ message: 'Wrong current password.' });

    if (newPassword.length < 4)
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated.' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔐 CURRENT USER
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;