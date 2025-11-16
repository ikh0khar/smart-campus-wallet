require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const transactionsRouter = require('./routes/transactions');
const budgetsRouter = require('./routes/budgets');

const app = express();

// Connect to MongoDB (non-blocking - server will start even if MongoDB fails)
// This is important for Railway deployment where MongoDB might take time to initialize
connectDB().catch(err => {
  console.error('⚠️  MongoDB connection error:', err.message);
  console.error('⚠️  Server will continue, but database operations will fail until MongoDB is connected');
  console.error('⚠️  Check MONGODB_URI environment variable and MongoDB service status');
  // Don't exit - let server start and retry connection
});

// Middleware
// CORS configuration - supports both same-domain and separate-domain deployments
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Set FRONTEND_URL for separate deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies/auth if needed
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure JSON responses for API routes
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/')) {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalStatus = res.status.bind(res);
    const originalEnd = res.end.bind(res);
    
    // Override json to ensure Content-Type is set
    res.json = function(data) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      return originalJson(data);
    };
    
    // Override send to prevent HTML responses
    res.send = function(data) {
      if (typeof data === 'string') {
        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
          // HTML is being sent - convert to JSON error
          console.error('ERROR: Attempted to send HTML for API route:', req.method, req.path);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
          }
          return originalJson({
            success: false,
            message: 'Server error: HTML response received instead of JSON',
            path: req.path,
            method: req.method
          });
        }
      }
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      return originalSend(data);
    };
    
    // Override end to catch any HTML
    res.end = function(chunk, encoding) {
      if (chunk && typeof chunk === 'string' && (chunk.trim().startsWith('<!DOCTYPE') || chunk.trim().startsWith('<html'))) {
        console.error('ERROR: Attempted to end with HTML for API route:', req.method, req.path);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
        }
        return originalJson({
          success: false,
          message: 'Server error: HTML response received instead of JSON',
          path: req.path,
          method: req.method
        });
      }
      return originalEnd(chunk, encoding);
    };
    
    // Ensure Content-Type is set early
    res.setHeader('Content-Type', 'application/json');
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
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    status: 'OK', 
    message: 'Smart Campus Wallet API is running',
    mongodb: {
      connected: dbStatus === 1,
      state: dbStates[dbStatus] || 'unknown',
      uri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    }
  });
});

// Diagnostic endpoint to check MongoDB connection
app.get('/api/diagnostic', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.json({
    server: 'running',
    mongodb: {
      uri: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
      state: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    message: dbStatus === 1 
      ? 'Everything is working! MongoDB is connected.'
      : 'MongoDB is not connected. Check MONGODB_URI environment variable and MongoDB service status.'
  });
});

// Error handler middleware - MUST be before 404 handler and static files
app.use((err, req, res, next) => {
  // Only handle JSON errors for API routes
  if (req.path && req.path.startsWith('/api/')) {
    console.error('API Error:', err);
    res.setHeader('Content-Type', 'application/json');
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

// 404 handler for API routes - must be after all routes but before static files
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/')) {
    // API route not found - return JSON (Express default handler would return HTML)
    console.log('404 - API route not found:', req.method, req.originalUrl);
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/transactions',
        'POST /api/transactions',
        'GET /api/budgets',
        'POST /api/budgets',
        'POST /api/budgets/check-rewards/:userId',
        'GET /api/activities/events',
        'GET /api/rewards/summary/:userId'
      ]
    });
    // Don't call next() - we've handled the response
  } else {
    // For non-API routes, let it continue to static file serving
    next();
  }
});

// Serve static files from public directory (must be last, after API routes)
// Only serve static files for non-API routes
app.use((req, res, next) => {
  if (req.path && !req.path.startsWith('/api/')) {
    express.static('public')(req, res, next);
  } else {
    next();
  }
});

// Catch-all for frontend routes (SPA fallback) - must be last
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (req.path && !req.path.startsWith('/api/')) {
    res.sendFile('index.html', { root: 'public' });
  } else {
    // If somehow we reach here for API routes, return JSON 404
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

// Start server (don't wait for MongoDB)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check MongoDB configuration
  const mongoose = require('mongoose');
  if (process.env.MONGODB_URI) {
    console.log(`💾 MongoDB URI: Set`);
    if (mongoose.connection.readyState === 1) {
      console.log(`✅ MongoDB: Connected`);
    } else {
      console.log(`⚠️  MongoDB: Not connected (state: ${mongoose.connection.readyState})`);
      console.log(`⚠️  Connection may still be establishing...`);
      console.log(`⚠️  Check logs above for connection errors`);
    }
  } else {
    console.log(`❌ MongoDB URI: NOT SET`);
    console.log(`📋 INSTRUCTIONS TO FIX:`);
    console.log(`   1. Go to Railway Dashboard → Your Service → Variables`);
    console.log(`   2. Click "+ New Variable"`);
    console.log(`   3. Name: MONGODB_URI`);
    console.log(`   4. Value: Your MongoDB connection string`);
    console.log(`   5. See RAILWAY_MONGODB_SETUP.md for detailed instructions`);
    console.log(`⚠️  Server will start, but API endpoints will fail without MongoDB`);
  }
});

