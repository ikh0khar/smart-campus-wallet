/**
 * Verify MongoDB database integration is complete
 * 
 * Usage:
 *   node scripts/verify-integration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const { User, Transaction } = require('../models');

async function verifyIntegration() {
  console.log('🔍 Verifying MongoDB Database Integration\n');
  console.log('='.repeat(50));
  
  let allChecksPassed = true;

  // Check 1: Verify .env file exists
  console.log('\n1️⃣  Checking .env file...');
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('MONGODB_URI')) {
      console.log('   ✅ .env file exists with MONGODB_URI');
    } else {
      console.log('   ❌ .env file exists but missing MONGODB_URI');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ .env file not found');
    allChecksPassed = false;
  }

  // Check 2: Verify required files exist
  console.log('\n2️⃣  Checking required files...');
  const requiredFiles = [
    'config/database.js',
    'models/User.js',
    'models/Transaction.js',
    'models/index.js',
    'scripts/import-csv.js',
    'scripts/test-connection.js'
  ];

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allChecksPassed = false;
    }
  });

  // Check 3: Verify dependencies are installed
  console.log('\n3️⃣  Checking dependencies...');
  if (fs.existsSync('node_modules/mongoose')) {
    console.log('   ✅ mongoose installed');
  } else {
    console.log('   ❌ mongoose not installed - run: npm install');
    allChecksPassed = false;
  }

  if (fs.existsSync('node_modules/dotenv')) {
    console.log('   ✅ dotenv installed');
  } else {
    console.log('   ❌ dotenv not installed - run: npm install');
    allChecksPassed = false;
  }

  // Check 4: Test database connection
  console.log('\n4️⃣  Testing database connection...');
  try {
    await connectDB();
    console.log('   ✅ Database connection successful');
    
    // Check 5: Verify collections exist and have data
    console.log('\n5️⃣  Checking database collections...');
    
    const transactionCount = await Transaction.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`   ✅ Transactions collection: ${transactionCount} documents`);
    console.log(`   ✅ Users collection: ${userCount} documents`);
    
    if (transactionCount === 0) {
      console.log('   ⚠️  No transactions found - run import script to load data');
    }
    if (userCount === 0) {
      console.log('   ⚠️  No users found - run import script to load data');
    }

    // Check 6: Test model functionality
    console.log('\n6️⃣  Testing model functionality...');
    try {
      const sampleTransaction = await Transaction.findOne();
      if (sampleTransaction) {
        console.log('   ✅ Transaction model working correctly');
        console.log(`      Sample: ${sampleTransaction.transactionId} - ${sampleTransaction.merchant}`);
      } else {
        console.log('   ⚠️  Transaction model works but no data found');
      }

      const sampleUser = await User.findOne();
      if (sampleUser) {
        console.log('   ✅ User model working correctly');
        console.log(`      Sample: ${sampleUser.userId}`);
      } else {
        console.log('   ⚠️  User model works but no data found');
      }
    } catch (error) {
      console.log(`   ❌ Model test failed: ${error.message}`);
      allChecksPassed = false;
    }

    // Close connection
    const mongoose = require('mongoose');
    await mongoose.connection.close();

  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    allChecksPassed = false;
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (allChecksPassed) {
    console.log('\n✅ MongoDB Database Integration: COMPLETE\n');
    console.log('🎉 All checks passed! Your database integration is ready to use.\n');
    console.log('📝 Next steps:');
    console.log('   - Run queries: npm run examples');
    console.log('   - Import data: npm run import data/wallet_transactions_sample.csv --clear');
    console.log('');
  } else {
    console.log('\n⚠️  MongoDB Database Integration: NEEDS ATTENTION\n');
    console.log('Some checks failed. Please review the issues above.\n');
  }

  process.exit(allChecksPassed ? 0 : 1);
}

verifyIntegration();

