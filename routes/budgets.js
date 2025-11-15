const express = require('express');
const router = express.Router();
const sampleBudgets = require('../data/sampleBudgets');
const { getTransactions } = require('../data/loadSampleData');

// Category mapping from CSV to our API format
const categoryMap = {
  'dining': 'food',
  'transport': 'transportation',
  'supplies': 'other',
  'pharmacy': 'utilities',
};

const normalizeCategory = (category) => {
  const lower = category.toLowerCase();
  return categoryMap[lower] || lower;
};

// Helper to calculate spent amount for a budget
const calculateSpent = (budget, transactions) => {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  return transactions
    .filter(t => {
      const tDate = new Date(t.date);
      const normalizedCategory = normalizeCategory(t.category);
      return normalizedCategory === budget.category &&
             tDate >= startDate &&
             tDate <= endDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Public
router.get('/', (req, res) => {
  try {
    const { isActive } = req.query;
    let budgets = [...sampleBudgets];

    if (isActive !== undefined) {
      budgets = budgets.filter(b => b.isActive === (isActive === 'true'));
    }

    // Calculate current spent amounts
    const transactions = getTransactions();
    const budgetsWithProgress = budgets.map(budget => {
      const spent = calculateSpent(budget, transactions);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

      return {
        ...budget,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status,
      };
    });

    res.json({
      success: true,
      count: budgetsWithProgress.length,
      data: budgetsWithProgress,
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Public
router.get('/:id', (req, res) => {
  try {
    const budget = sampleBudgets.find(b => b.id === parseInt(req.params.id));

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const transactions = getTransactions();
    const spent = calculateSpent(budget, transactions);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    res.json({
      success: true,
      data: {
        ...budget,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status,
      },
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/budgets/:id/progress
// @desc    Get detailed budget progress (chart-friendly)
// @access  Public
router.get('/:id/progress', (req, res) => {
  try {
    const budget = sampleBudgets.find(b => b.id === parseInt(req.params.id));

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const transactions = getTransactions();
    const spent = calculateSpent(budget, transactions);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    // Format for progress charts
    const progressData = [
      { label: 'Spent', value: parseFloat(spent.toFixed(2)), color: status === 'exceeded' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981' },
      { label: 'Remaining', value: parseFloat(Math.max(0, remaining).toFixed(2)), color: '#e5e7eb' },
    ];

    res.json({
      success: true,
      data: {
        budget: {
          id: budget.id,
          name: budget.name,
          category: budget.category,
          amount: budget.amount,
          period: budget.period,
        },
        progress: {
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat(remaining.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          status,
        },
        chartData: progressData,
      },
    });
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/budgets/alerts
// @desc    Get budgets that need attention (close to or over limit)
// @access  Public
router.get('/alerts', (req, res) => {
  try {
    const { threshold = 80 } = req.query; // Default 80% threshold

    const alerts = sampleBudgets
      .filter(b => b.isActive)
      .map(budget => {
        const transactions = getTransactions();
    const spent = calculateSpent(budget, transactions);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        return {
          ...budget,
          spent: parseFloat(spent.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
        };
      })
      .filter(b => b.percentage >= threshold)
      .sort((a, b) => b.percentage - a.percentage);

    res.json({
      success: true,
      count: alerts.length,
      threshold: parseFloat(threshold),
      data: alerts,
    });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget (mock - will be replaced with database)
// @access  Public
router.post('/', (req, res) => {
  try {
    const { name, category, amount, period, startDate, endDate } = req.body;

    // Validation
    if (!name || !category || !amount || !period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const newBudget = {
      id: sampleBudgets.length + 1,
      userId: 1, // Mock user ID
      name,
      category,
      amount: parseFloat(amount),
      period,
      startDate,
      endDate,
      spent: 0,
      isActive: true,
    };

    // In real app, save to database
    // For now, just return the created budget
    res.status(201).json({
      success: true,
      data: newBudget,
      message: 'Budget created (mock - not persisted)',
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;

