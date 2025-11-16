/**
 * Export all database models
 */

const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

module.exports = {
  User,
  Transaction,
  Budget
};

