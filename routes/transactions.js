const express = require('express');
const router = express.Router();
const { getTransactions } = require('../data/loadSampleData');

// Category mapping from CSV to our API format
const categoryMap = {
  'dining': 'food',
  'transport': 'transportation',
  'supplies': 'other',
  'pharmacy': 'utilities',
};

// Helper function to normalize category
const normalizeCategory = (category) => {
  const lower = category.toLowerCase();
  return categoryMap[lower] || lower;
};

// Helper function to filter transactions
const filterTransactions = (transactions, filters) => {
  let filtered = [...transactions];

  if (filters.category) {
    filtered = filtered.filter(t => normalizeCategory(t.category) === filters.category);
  }

  if (filters.startDate) {
    filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.startDate));
  }

  if (filters.endDate) {
    filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.endDate));
  }

  if (filters.minAmount) {
    filtered = filtered.filter(t => t.amount >= parseFloat(filters.minAmount));
  }

  if (filters.maxAmount) {
    filtered = filtered.filter(t => t.amount <= parseFloat(filters.maxAmount));
  }

  return filtered;
};

// @route   GET /api/transactions
// @desc    Get all transactions with optional filters
// @access  Public
router.get('/', (req, res) => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, userId, sortBy = 'date', sortOrder = 'desc' } = req.query;

    let transactions = getTransactions();
    
    // Filter by userId if provided
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId);
    }
    
    transactions = filterTransactions(transactions, {
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    });

    // Normalize categories in response
    transactions = transactions.map(t => ({
      ...t,
      category: normalizeCategory(t.category),
    }));

    // Sort transactions
    transactions.sort((a, b) => {
      const aValue = sortBy === 'date' ? new Date(a.date) : a[sortBy];
      const bValue = sortBy === 'date' ? new Date(b.date) : b[sortBy];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get spending summary (totals, averages, etc.)
// @access  Public
router.get('/summary', (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    let transactions = getTransactions();
    
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId);
    }
    
    transactions = filterTransactions(transactions, { startDate, endDate });
    
    // Normalize categories
    transactions = transactions.map(t => ({
      ...t,
      category: normalizeCategory(t.category),
    }));

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.length;
    const average = count > 0 ? total / count : 0;

    // Calculate by time period if date range provided
    const days = startDate && endDate
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1
      : 30; // default to 30 days

    const dailyAverage = total / days;
    const weeklyAverage = dailyAverage * 7;
    const monthlyAverage = dailyAverage * 30;

    res.json({
      success: true,
      data: {
        total,
        count,
        average,
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        weeklyAverage: parseFloat(weeklyAverage.toFixed(2)),
        monthlyAverage: parseFloat(monthlyAverage.toFixed(2)),
        period: { startDate, endDate, days },
      },
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/transactions/categories
// @desc    Get spending breakdown by category (chart-friendly format)
// @access  Public
router.get('/categories', (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    let transactions = getTransactions();
    
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId);
    }
    
    transactions = filterTransactions(transactions, { startDate, endDate });
    
    // Normalize categories
    transactions = transactions.map(t => ({
      ...t,
      category: normalizeCategory(t.category),
    }));

    // Group by category
    const categoryMap = {};
    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          amount: 0,
          count: 0,
          transactions: [],
        };
      }
      categoryMap[category].amount += transaction.amount;
      categoryMap[category].count += 1;
      categoryMap[category].transactions.push(transaction);
    });

    // Convert to array format (perfect for bar charts)
    const categoryBreakdown = Object.values(categoryMap).map(item => ({
      category: item.category,
      amount: parseFloat(item.amount.toFixed(2)),
      count: item.count,
      percentage: 0, // Will calculate below
    }));

    // Calculate percentages
    const total = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
    categoryBreakdown.forEach(item => {
      item.percentage = total > 0 ? parseFloat(((item.amount / total) * 100).toFixed(2)) : 0;
    });

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: categoryBreakdown,
      total,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/transactions/trends
// @desc    Get spending trends over time (chart-friendly format)
// @access  Public
router.get('/trends', (req, res) => {
  try {
    const { period = 'daily', startDate, endDate, userId } = req.query;
    let transactions = getTransactions();
    
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId);
    }
    
    transactions = filterTransactions(transactions, { startDate, endDate });
    
    // Normalize categories
    transactions = transactions.map(t => ({
      ...t,
      category: normalizeCategory(t.category),
    }));

    // Group by time period
    const trendsMap = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        // Get week number
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!trendsMap[key]) {
        trendsMap[key] = {
          date: key,
          amount: 0,
          count: 0,
        };
      }
      trendsMap[key].amount += transaction.amount;
      trendsMap[key].count += 1;
    });

    // Convert to array and format for charts
    const trends = Object.values(trendsMap)
      .map(item => ({
        date: item.date,
        amount: parseFloat(item.amount.toFixed(2)),
        count: item.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      period,
      data: trends,
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

