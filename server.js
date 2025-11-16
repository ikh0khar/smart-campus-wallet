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

// Middleware to ensure JSON responses for API routes
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/')) {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to ensure Content-Type is set
    res.json = function(data) {
      res.setHeader('Content-Type', 'application/json');
      return originalJson(data);
    };
    
    // Override send to ensure JSON for API routes
    const originalSend = res.send.bind(res);
    res.send = function(data) {
      if (typeof data === 'string' && data.trim().startsWith('<')) {
        // If HTML is being sent, convert to JSON error
        return res.status(500).json({
          success: false,
          message: 'Server error: HTML response received instead of JSON'
        });
      }
      res.setHeader('Content-Type', 'application/json');
      return originalSend(data);
    };
  }
  next();
});

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/activities', require('./routes/activities'));
app.use('/api/rewards', require('./routes/rewards'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Campus Wallet API is running' });
});

// 404 handler for API routes - must be before static file serving
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/transactions',
        'GET /api/budgets',
        'GET /api/activities/events',
        'GET /api/rewards/summary/:userId'
      ]
    });
  }
  next();
});

// Error handler middleware - must be before static file serving
app.use((err, req, res, next) => {
  // Only handle JSON errors for API routes
  if (req.path && req.path.startsWith('/api/')) {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // For non-API routes, use default error handling
    next(err);
  }
});

// Serve static files from public directory (must be last)
app.use(express.static('public'));

// Catch-all for frontend routes (SPA fallback)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile('index.html', { root: 'public' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Frontend: http://localhost:${PORT}/`);
});

