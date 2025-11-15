/**
 * Example database queries for smart-campus-wallet
 * 
 * This file demonstrates various ways to query the MongoDB database
 * 
 * Usage:
 *   node examples/database-queries.js
 */

require('dotenv').config();
const connectDB = require('../config/database');
const { User, Transaction } = require('../models');

async function exampleQueries() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Example 1: Get all transactions for a specific user
    console.log('📊 Example 1: Get all transactions for user U001');
    const userTransactions = await Transaction.find({ userId: 'U001' })
      .sort({ date: -1 })
      .limit(5);
    console.log(`Found ${userTransactions.length} transactions:\n`);
    userTransactions.forEach(t => {
      console.log(`  ${t.transactionId}: ${t.merchant} - $${t.amount} (${t.category})`);
    });
    console.log('');

    // Example 2: Get total spending by category
    console.log('📊 Example 2: Total spending by category for user U001');
    const categorySpending = await Transaction.aggregate([
      { $match: { userId: 'U001' } },
      { 
        $group: { 
          _id: '$category', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { total: -1 } }
    ]);
    categorySpending.forEach(item => {
      console.log(`  ${item._id}: $${item.total.toFixed(2)} (${item.count} transactions)`);
    });
    console.log('');

    // Example 3: Get transactions in a date range
    console.log('📊 Example 3: Transactions in October 2025');
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-31');
    const octoberTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    console.log(`Found ${octoberTransactions.length} transactions in October 2025\n`);

    // Example 4: Get top merchants by transaction count
    console.log('📊 Example 4: Top 5 merchants by transaction count');
    const topMerchants = await Transaction.aggregate([
      {
        $group: {
          _id: '$merchant',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    topMerchants.forEach((merchant, index) => {
      console.log(`  ${index + 1}. ${merchant._id}: ${merchant.count} transactions, $${merchant.totalAmount.toFixed(2)} total`);
    });
    console.log('');

    // Example 5: Get transactions by payment method
    console.log('📊 Example 5: Transactions by payment method');
    const byPaymentMethod = await Transaction.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    byPaymentMethod.forEach(item => {
      console.log(`  ${item._id}: ${item.count} transactions, $${item.total.toFixed(2)} total`);
    });
    console.log('');

    // Example 6: Get user information
    console.log('📊 Example 6: Get all users');
    const users = await User.find().limit(5);
    console.log(`Found ${users.length} users:\n`);
    users.forEach(u => {
      console.log(`  ${u.userId}: Balance $${u.balance || 0}`);
    });
    console.log('');

    // Example 7: Calculate total spending per user
    console.log('📊 Example 7: Total spending per user (top 5)');
    const userSpending = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);
    userSpending.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user._id}: $${user.totalSpent.toFixed(2)} (${user.transactionCount} transactions)`);
    });
    console.log('');

    // Example 8: Get daily spending trend
    console.log('📊 Example 8: Daily spending trend for user U001 (last 5 days)');
    const dailySpending = await Transaction.aggregate([
      { $match: { userId: 'U001' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          dailyTotal: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 5 }
    ]);
    dailySpending.forEach(day => {
      console.log(`  ${day._id}: $${day.dailyTotal.toFixed(2)} (${day.count} transactions)`);
    });

    console.log('\n✅ Query examples completed!\n');

    // Close connection
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run examples
exampleQueries();

