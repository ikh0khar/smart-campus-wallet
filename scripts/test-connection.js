/**
 * Test MongoDB connection
 * 
 * Usage:
 *   node scripts/test-connection.js
 */

require('dotenv').config();
const connectDB = require('../config/database');

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log(`📍 Connection string: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wallet'}`);
    console.log('');
    
    await connectDB();
    
    console.log('');
    console.log('✅ Connection successful!');
    console.log('🎉 MongoDB is ready to use.');
    
    // Close connection after test
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('🔌 Connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Connection failed!');
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check your MONGODB_URI in .env file');
    console.error('   3. If using MongoDB Atlas, verify your connection string and network access');
    console.error('');
    process.exit(1);
  }
}

testConnection();

