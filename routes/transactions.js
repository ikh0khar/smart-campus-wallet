const express = require('express');
const router = express.Router();
// Use JSON database instead of MongoDB
const { Transaction, User } = require('../db/json-db');

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
    const findResult = await Transaction.find(query);
    const sortResult = findResult.sort(sort);
    let transactions = await sortResult.lean();

    // Normalize categories in response and transform to match API format
    transactions = transactions.map(t => {
      // Handle date - could be string or Date object
      let dateStr = t.date;
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString();
      } else if (dateStr && typeof dateStr === 'string') {
        // Already a string, ensure it's in ISO format
        dateStr = new Date(dateStr).toISOString();
      }
      
      return {
        id: t._id,
        transactionId: t.transactionId,
        userId: t.userId,
        type: 'purchase',
        amount: t.amount,
        category: normalizeCategory(t.category),
        description: t.merchant,
        location: t.location,
        paymentMethod: t.paymentMethod,
        date: dateStr || new Date().toISOString(),
      };
    });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoServerError' || error.message.includes('MongoServerError') || error.message.includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please check MongoDB connection.',
        error: error.message,
        diagnostic: '/api/diagnostic'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Get transactions and calculate summary (JSON DB doesn't have aggregation)
    const transactions = await (await Transaction.find(query)).lean();
    
    const result = transactions.reduce((acc, t) => {
      acc.total += parseFloat(t.amount || 0);
      acc.count += 1;
      return acc;
    }, { total: 0, count: 0 });
    
    result.average = result.count > 0 ? result.total / result.count : 0;

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
    const transactions = await (await Transaction.find(query)).lean();

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
    
    // Build query
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
    const transactionsResult = await Transaction.find(query);
    let transactions = await transactionsResult.lean();
    
    // Ensure transactions is an array
    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    // Group by time period
    const trendsMap = {};

    transactions.forEach(transaction => {
      // Handle date - could be string or Date object
      let date;
      if (transaction.date instanceof Date) {
        date = transaction.date;
      } else if (typeof transaction.date === 'string') {
        date = new Date(transaction.date);
      } else {
        date = new Date(); // fallback
      }
      
      // Skip invalid dates
      if (isNaN(date.getTime())) {
        return;
      }
      
      let key;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        // Get week number
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        const month = date.getMonth() + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        key = `${date.getFullYear()}-${monthStr}`;
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id first, then by transactionId
    let transaction = await Transaction.findById(id);
    
    if (!transaction) {
      transaction = await Transaction.findOne({ transactionId: id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const transactionData = {
      id: transaction._id,
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      type: 'purchase',
      amount: transaction.amount,
      category: normalizeCategory(transaction.category),
      description: transaction.merchant,
      location: transaction.location,
      paymentMethod: transaction.paymentMethod,
      date: transaction.date instanceof Date 
        ? transaction.date.toISOString() 
        : (typeof transaction.date === 'string' ? new Date(transaction.date).toISOString() : new Date().toISOString()),
    };

    res.json({
      success: true,
      data: transactionData,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { transactionId, userId, merchant, category, amount, paymentMethod, location, date } = req.body;

    // Validation
    if (!transactionId || !userId || !merchant || !category || amount === undefined || !paymentMethod || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transactionId, userId, merchant, category, amount, paymentMethod, date',
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than or equal to 0',
      });
    }

    // Check if transactionId already exists
    const existing = await Transaction.findOne({ transactionId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Transaction with this transactionId already exists',
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId,
      userId,
      merchant: merchant.trim(),
      category: category.trim(),
      amount: parseFloat(amount),
      paymentMethod: paymentMethod.trim(),
      location: location ? location.trim() : '',
      date: new Date(date),
    });

    // Update user balance if user exists
    try {
      const user = await User.findOne({ userId });
      if (user) {
        const updatedBalance = (user.balance || 0) - parseFloat(amount);
        await User.findByIdAndUpdate(user._id, { balance: updatedBalance });
      }
    } catch (userError) {
      console.warn('Could not update user balance:', userError.message);
      // Don't fail the transaction creation if user update fails
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        type: 'purchase',
        amount: transaction.amount,
        category: normalizeCategory(transaction.category),
        description: transaction.merchant,
        location: transaction.location,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date instanceof Date 
          ? transaction.date.toISOString() 
          : (typeof transaction.date === 'string' ? new Date(transaction.date).toISOString() : new Date().toISOString()),
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Transaction with this transactionId already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update an existing transaction
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { merchant, category, amount, paymentMethod, location, date } = req.body;

    // Find transaction by MongoDB _id or transactionId
    let transaction = await Transaction.findById(id);
    
    if (!transaction) {
      transaction = await Transaction.findOne({ transactionId: id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Store original amount for user balance update
    const originalAmount = transaction.amount;

    // Build update object
    const update = {};
    if (merchant !== undefined) update.merchant = merchant.trim();
    if (category !== undefined) update.category = category.trim();
    if (amount !== undefined) {
      if (amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than or equal to 0',
        });
      }
      update.amount = parseFloat(amount);
    }
    if (paymentMethod !== undefined) update.paymentMethod = paymentMethod.trim();
    if (location !== undefined) update.location = location.trim();
    if (date !== undefined) update.date = new Date(date);

    // Update transaction
    const updated = await Transaction.findByIdAndUpdate(transaction._id, update);

    // Update user balance if amount changed
    if (amount !== undefined && amount !== originalAmount) {
      try {
        const user = await User.findOne({ userId: transaction.userId });
        if (user) {
          const difference = originalAmount - parseFloat(amount);
          const newBalance = (user.balance || 0) + difference;
          await User.findByIdAndUpdate(user._id, { balance: newBalance });
        }
      } catch (userError) {
        console.warn('Could not update user balance:', userError.message);
        // Don't fail the transaction update if user update fails
      }
    }
    
    const finalTransaction = updated || transaction;

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        type: 'purchase',
        amount: transaction.amount,
        category: normalizeCategory(transaction.category),
        description: transaction.merchant,
        location: transaction.location,
        paymentMethod: transaction.paymentMethod,
        date: transaction.date instanceof Date 
          ? transaction.date.toISOString() 
          : (typeof transaction.date === 'string' ? new Date(transaction.date).toISOString() : new Date().toISOString()),
      },
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction by MongoDB _id or transactionId
    let transaction = await Transaction.findById(id);
    
    if (!transaction) {
      transaction = await Transaction.findOne({ transactionId: id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const transactionData = {
      id: transaction._id,
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      amount: transaction.amount,
    };

    // Update user balance (add back the amount)
    try {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        const newBalance = (user.balance || 0) + transaction.amount;
        await User.findByIdAndUpdate(user._id, { balance: newBalance });
      }
    } catch (userError) {
      console.warn('Could not update user balance:', userError.message);
      // Don't fail the transaction deletion if user update fails
    }

    // Delete transaction
    await Transaction.findByIdAndDelete(transaction._id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: transactionData,
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
