const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided.' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── "Logout all devices" check ──────────────────────────────────────────
    // Fetch just the fields we need — not the whole user document
    const user = await User.findById(decoded.id).select('passwordChangedAt isAllowed');

    if (!user)
      return res.status(401).json({ message: 'User no longer exists.' });

    if (!user.isAllowed)
      return res.status(403).json({ message: 'Access denied.' });

    if (user.passwordChangedAt) {
      // JWT iat is in seconds; passwordChangedAt is a JS Date (milliseconds)
      const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAtSec) {
        // Token was issued before the password change → reject it
        return res.status(401).json({
          message: 'Password was changed. Please log in again.',
          code:    'PASSWORD_CHANGED',   // frontend reads this to show the right message
        });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
