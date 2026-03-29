const router      = require('express').Router();
const jwt         = require('jsonwebtoken');
const User        = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const auth        = require('../middleware/auth');

// Token
const sign = (user) => jwt.sign(
  { id: user._id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// Write activity log entry from backend
async function writeLog(userId, username, type, action, title, details) {
  try {
    const now  = new Date();
    const pad2 = n => String(n).padStart(2, '0');
    await ActivityLog.create({
      type, action, title,
      details: details || '',
      changes: null,
      user:    username,
      date: `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}`,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`,
      ts:   now.getTime(),
      createdBy: userId,
    });
  } catch (e) { /* never block the main response */ }
}


// 🔐 LOGIN
router.post('/login', async (req, res) => {
  console.log("login hit");
  try {
    const { username, password } = req.body;
    console.log(username);

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
      token:            sign(user),
      username:         user.username,
      telegramBotToken: user.telegramBotToken || '',
      telegramChatId:   user.telegramChatId   || ''
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔐 CHANGE PASSWORD
// - Stamps passwordChangedAt  → invalidates ALL existing tokens on other devices
// - Writes ActivityLog entry from backend (guaranteed even if frontend crashes)
// - Returns a fresh token so the current device stays logged in
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    if (!await user.matchPassword(currentPassword))
      return res.status(401).json({ message: 'Wrong current password.' });

    if (newPassword.length < 4)
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });

    // Update password and stamp the change time
    user.password          = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Write audit log to DB
    await writeLog(
      user._id, user.username,
      'session', 'password-change',
      'Password Changed — ' + user.username,
      'Password was changed successfully. All other active sessions have been logged out automatically.'
    );

    // Return fresh token so THIS device stays logged in
    res.json({
      message:  'Password updated. All other devices have been logged out.',
      token:    sign(user),
      username: user.username,
    });

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
      id:       user._id,
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔔 GET Telegram alert config
router.get('/alert-config', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('telegramBotToken telegramChatId');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      telegramBotToken: user.telegramBotToken || '',
      telegramChatId:   user.telegramChatId   || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔔 SAVE Telegram alert config
router.post('/alert-config', auth, async (req, res) => {
  try {
    const { telegramBotToken, telegramChatId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.telegramBotToken = telegramBotToken || '';
    user.telegramChatId   = telegramChatId   || '';
    await user.save();

    res.json({ message: 'Telegram config saved.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
