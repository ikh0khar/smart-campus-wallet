require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const transactionsRouter = require('./routes/transactions');
const budgetsRouter = require('./routes/budgets');

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
// CORS configuration - allows requests from any origin (for development)
app.use(cors({
  origin: '*', // In production, specify your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/activities', require('./routes/activities'));
app.use('/api/rewards', require('./routes/rewards'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Campus Wallet API is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

