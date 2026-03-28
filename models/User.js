const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },

  password: {
    type: String,
    required: true
  },

  isAllowed: {
    type: Boolean,
    default: true
  },

  // Stamped every time password is changed.
  // The auth middleware rejects any JWT whose iat is older than this,
  // which forces every other device to re-login automatically.
  passwordChangedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });


// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
