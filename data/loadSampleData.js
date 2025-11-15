const { parseCSV } = require('../utils/csvParser');
const path = require('path');

// Load and transform wallet transactions
function loadTransactions() {
  const csvPath = path.join(__dirname, 'wallet_transactions_sample.csv');
  const csvData = parseCSV(csvPath);
  
  // Transform CSV data to match our API format
  return csvData.map((row, index) => {
    // Parse date - handle YYYY-MM-DD format
    let date;
    if (row.date) {
      // If date is just YYYY-MM-DD, add time to make it valid
      const dateStr = row.date.includes('T') ? row.date : `${row.date}T00:00:00Z`;
      date = new Date(dateStr);
      // If invalid, use current date
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    } else {
      date = new Date();
    }
    
    return {
      id: index + 1,
      transactionId: row.transaction_id,
      userId: row.user_id,
      type: 'purchase',
      amount: parseFloat(row.amount) || 0,
      category: row.category ? row.category.toLowerCase() : 'other',
      description: row.merchant || '',
      location: row.location || '',
      paymentMethod: row.payment_method || '',
      date: date.toISOString(),
    };
  });
}

// Load and transform users
function loadUsers() {
  const csvPath = path.join(__dirname, 'users_sample.csv');
  const csvData = parseCSV(csvPath);
  
  return csvData.map((row) => ({
    userId: row.user_id,
    name: row.name,
    major: row.major,
    classYear: row.class_year,
    residenceType: row.residence_type,
    interests: row.interests ? row.interests.split(',') : [],
  }));
}

// Load and transform campus events
function loadEvents() {
  const csvPath = path.join(__dirname, 'campus_events_sample.csv');
  const csvData = parseCSV(csvPath);
  
  return csvData.map((row) => ({
    eventId: row.event_id,
    name: row.name,
    category: row.category,
    location: row.location,
    startTime: row.start_time,
    tags: row.tags ? row.tags.split(',') : [],
    cost: parseFloat(row.cost) || 0,
  }));
}

// Cache loaded data
let transactionsCache = null;
let usersCache = null;
let eventsCache = null;

function getTransactions() {
  if (!transactionsCache) {
    transactionsCache = loadTransactions();
  }
  return transactionsCache;
}

function getUsers() {
  if (!usersCache) {
    usersCache = loadUsers();
  }
  return usersCache;
}

function getEvents() {
  if (!eventsCache) {
    eventsCache = loadEvents();
  }
  return eventsCache;
}

// Reload data (useful for testing)
function reloadData() {
  transactionsCache = null;
  usersCache = null;
  eventsCache = null;
}

module.exports = {
  getTransactions,
  getUsers,
  getEvents,
  reloadData,
};

