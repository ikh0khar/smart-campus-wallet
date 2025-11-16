const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wallet';
    
    if (!mongoUri || mongoUri === 'mongodb://localhost:27017/smart-campus-wallet') {
      console.log('⚠️  MONGODB_URI not set, using default local MongoDB');
    }
    
    // Connection options for better Railway compatibility
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected - attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('📋 Make sure MONGODB_URI is set correctly in environment variables');
    console.error('📋 For Railway: Check your MongoDB service is running and connection string is correct');
    // Don't exit - let the server start and allow retry
    throw error;
  }
};

module.exports = connectDB;

