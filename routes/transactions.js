const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

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

// @route   GET /api/transactions
// @desc    Get all transactions with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, userId, sortBy = 'date', sortOrder = 'desc' } = req.query;

    // Build MongoDB query
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    // Handle category filter - need to check both original and normalized
    if (category) {
      const normalized = normalizeCategory(category);
      // Check if category matches any of the mapped values
      const originalCategories = Object.keys(categoryMap).filter(k => categoryMap[k] === normalized);
      if (originalCategories.length > 0) {
        query.category = { $in: [new RegExp(`^${category}$`, 'i'), ...originalCategories.map(c => new RegExp(`^${c}$`, 'i'))] };
      } else {
        query.category = new RegExp(`^${category}$`, 'i');
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Build sort object
    const sort = {};
    const sortField = sortBy === 'date' ? 'date' : sortBy === 'amount' ? 'amount' : 'date';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    let transactions = await Transaction.find(query).sort(sort).lean();

    // Normalize categories in response and transform to match API format
    transactions = transactions.map(t => ({
      id: t._id,
      transactionId: t.transactionId,
      userId: t.userId,
      type: 'purchase',
      amount: t.amount,
      category: normalizeCategory(t.category),
      description: t.merchant,
      location: t.location,
      paymentMethod: t.paymentMethod,
      date: t.date.toISOString(),
    }));

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
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Build MongoDB query
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Use aggregation for summary
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);

    const result = summary[0] || { total: 0, count: 0, average: 0 };

    // Calculate time period
    const days = startDate && endDate
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1
      : 30; // default to 30 days

    const dailyAverage = result.total / days;
    const weeklyAverage = dailyAverage * 7;
    const monthlyAverage = dailyAverage * 30;

    res.json({
      success: true,
      data: {
        total: parseFloat(result.total.toFixed(2)),
        count: result.count,
        average: parseFloat((result.average || 0).toFixed(2)),
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
router.get('/categories', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Build MongoDB query
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get transactions and group by category
    const transactions = await Transaction.find(query).lean();

    // Normalize categories and group
    const categoryMap = {};
    transactions.forEach(transaction => {
      const normalizedCategory = normalizeCategory(transaction.category);
      if (!categoryMap[normalizedCategory]) {
        categoryMap[normalizedCategory] = {
          category: normalizedCategory,
          amount: 0,
          count: 0,
          transactions: [],
        };
      }
      categoryMap[normalizedCategory].amount += transaction.amount;
      categoryMap[normalizedCategory].count += 1;
      categoryMap[normalizedCategory].transactions.push(transaction);
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
router.get('/trends', async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate, userId } = req.query;

    // Build MongoDB query
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get transactions
    const transactions = await Transaction.find(query).lean();

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
