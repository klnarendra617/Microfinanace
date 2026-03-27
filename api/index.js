const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/auth',     require('../routes/auth'));
app.use('/api/loans',    require('../routes/loans'));
app.use('/api/payments', require('../routes/payments'));
app.use('/api/expenses', require('../routes/expenses'));
app.use('/api/capital',  require('../routes/capital'));
app.use('/api/users',    require('../routes/users'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: 'GramSeva API running ✅' })
);

// Root API handler (optional, if somebody hits /api)
app.get('/', (req, res) =>
  res.json({ status: 'ok', message: 'GramSeva API is running' })
);

// Connection caching for serverless
let isConnected = false;

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required.');
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return res.status(500).json({ error: err.message });
  }

  return app(req, res);
};