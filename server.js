const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────


app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || // allow Postman / direct calls
      origin.includes("vercel.app") || // allow ALL Vercel deployments
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://localhost")
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked: " + origin));
    }
  },
  credentials: true
}));

// ✅ Handle preflight requests
app.options("*", cors());

app.use(express.json());

// ── Routes ──────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/loans',    require('./routes/loans'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/capital',  require('./routes/capital'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/activitylog', require('./routes/activitylog'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GramSeva API running ✅' });
});

// Root route (for testing)
app.get('/', (req, res) => {
  res.send('GramSeva Backend Running 🚀');
});

// ── Connect DB & Start ──────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI. Set it in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;