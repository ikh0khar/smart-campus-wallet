#!/usr/bin/env node

/**
 * Import data script for production deployment
 * This can be run remotely or locally pointing to production MongoDB
 * 
 * Usage:
 *   MONGODB_URI=your-production-uri node scripts/deploy-import-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import transaction CSV import function
const importCSV = require('./import-csv').importCSV || async function(filePath) {
  console.log('Note: Use npm run import for CSV import');
};

// Import seed functions
const seedBudgets = require('../scripts/seed-budgets');
const seedEvents = require('../scripts/seed-events');

async function deployImportData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wallet';
    
    console.log('🚀 Starting production data import...');
    console.log(`📡 Connecting to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check what needs to be imported
    const Transaction = require('../models/Transaction');
    const Budget = require('../models/Budget');
    const Event = require('../models/Event');
    
    const transactionCount = await Transaction.countDocuments();
    const budgetCount = await Budget.countDocuments();
    const eventCount = await Event.countDocuments();
    
    console.log('\n📊 Current database state:');
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Budgets: ${budgetCount}`);
    console.log(`   Events: ${eventCount}`);
    
    // Import transactions if needed
    const csvPath = path.join(__dirname, '../data/wallet_transactions_sample.csv');
    if (fs.existsSync(csvPath) && transactionCount === 0) {
      console.log('\n📥 Importing transactions...');
      console.log('   Run: npm run import data/wallet_transactions_sample.csv');
      console.log('   Or use: node scripts/import-csv.js data/wallet_transactions_sample.csv');
    }
    
    // Seed budgets if needed
    if (budgetCount === 0) {
      console.log('\n📥 Seeding budgets...');
      try {
        await seedBudgets();
        console.log('   ✅ Budgets seeded');
      } catch (error) {
        console.error('   ❌ Error seeding budgets:', error.message);
      }
    } else {
      console.log('\n✅ Budgets already exist');
    }
    
    // Seed events if needed
    if (eventCount === 0) {
      console.log('\n📥 Seeding events...');
      try {
        await seedEvents();
        console.log('   ✅ Events seeded');
      } catch (error) {
        console.error('   ❌ Error seeding events:', error.message);
      }
    } else {
      console.log('\n✅ Events already exist');
    }
    
    // Final count
    const finalTransactionCount = await Transaction.countDocuments();
    const finalBudgetCount = await Budget.countDocuments();
    const finalEventCount = await Event.countDocuments();
    
    console.log('\n✅ Import complete!');
    console.log('\n📊 Final database state:');
    console.log(`   Transactions: ${finalTransactionCount}`);
    console.log(`   Budgets: ${finalBudgetCount}`);
    console.log(`   Events: ${finalEventCount}`);
    
    if (finalTransactionCount === 0) {
      console.log('\n⚠️  Transactions are empty. To import:');
      console.log('   1. Set MONGODB_URI environment variable');
      console.log('   2. Run: npm run import data/wallet_transactions_sample.csv');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployImportData();
}

module.exports = deployImportData;

