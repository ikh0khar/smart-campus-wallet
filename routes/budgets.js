const express = require('express');
const router = express.Router();
const { Budget, Transaction } = require('../models');
const { checkBudgetAchievement } = require('../utils/rewardsMongo');

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

// Helper to calculate spent amount for a budget from MongoDB
const calculateSpent = async (budget, transactions = null) => {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  // Build query for transactions matching budget criteria
  const query = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };

  // Match category - check both original and normalized
  const normalizedCategory = normalizeCategory(budget.category);
  const originalCategories = Object.keys(categoryMap).filter(k => categoryMap[k] === normalizedCategory);
  
  if (originalCategories.length > 0) {
    // Check both original categories (Dining, Transport, etc.) and normalized (food, transportation, etc.)
    query.category = {
      $in: [
        new RegExp(`^${budget.category}$`, 'i'),
        ...originalCategories.map(c => new RegExp(`^${c}$`, 'i'))
      ]
    };
  } else {
    query.category = new RegExp(`^${budget.category}$`, 'i');
  }

  // Filter by userId if budget has userId
  if (budget.userId) {
    query.userId = budget.userId;
  }

  // Use provided transactions or query from database
  if (transactions) {
  return transactions
    .filter(t => {
      const tDate = new Date(t.date);
      const normalizedCategory = normalizeCategory(t.category);
      return normalizedCategory === budget.category &&
             tDate >= startDate &&
             tDate <= endDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  }

  // Query from MongoDB
  const matchingTransactions = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return matchingTransactions.length > 0 ? matchingTransactions[0].total : 0;
};

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { isActive, userId } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (userId) {
      query.userId = userId;
    }

    // Get budgets from MongoDB
    const budgets = await Budget.find(query).lean();

    // Calculate spent amounts for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpent(budget);
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

      return {
          id: budget._id.toString(),
          userId: budget.userId,
          name: budget.name,
          category: normalizeCategory(budget.category),
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate.toISOString().split('T')[0],
          endDate: budget.endDate.toISOString().split('T')[0],
          isActive: budget.isActive,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status,
      };
      })
    );

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
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const spent = await calculateSpent(budget);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    res.json({
      success: true,
      data: {
        id: budget._id.toString(),
        userId: budget.userId,
        name: budget.name,
        category: normalizeCategory(budget.category),
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate.toISOString().split('T')[0],
        endDate: budget.endDate.toISOString().split('T')[0],
        isActive: budget.isActive,
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
router.get('/:id/progress', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const spent = await calculateSpent(budget);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    // Format for progress charts
    const progressData = [
      { 
        label: 'Spent', 
        value: parseFloat(spent.toFixed(2)), 
        color: status === 'exceeded' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981' 
      },
      { 
        label: 'Remaining', 
        value: parseFloat(Math.max(0, remaining).toFixed(2)), 
        color: '#e5e7eb' 
      },
    ];

    res.json({
      success: true,
      data: {
        budget: {
          id: budget._id.toString(),
          name: budget.name,
          category: normalizeCategory(budget.category),
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
router.get('/alerts', async (req, res) => {
  try {
    const { threshold = 80, userId } = req.query; // Default 80% threshold

    // Build query
    const query = { isActive: true };
    if (userId) {
      query.userId = userId;
    }

    const budgets = await Budget.find(query).lean();

    // Calculate spent amounts and filter by threshold
    const alerts = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateSpent(budget);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        return {
          id: budget._id.toString(),
          userId: budget.userId,
          name: budget.name,
          category: normalizeCategory(budget.category),
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate.toISOString().split('T')[0],
          endDate: budget.endDate.toISOString().split('T')[0],
          isActive: budget.isActive,
          spent: parseFloat(spent.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
        };
      })
    );

    // Filter by threshold and sort
    const filteredAlerts = alerts
      .filter(b => b.percentage >= parseFloat(threshold))
      .sort((a, b) => b.percentage - a.percentage);

    res.json({
      success: true,
      count: filteredAlerts.length,
      threshold: parseFloat(threshold),
      data: filteredAlerts,
    });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/budgets/check-rewards/:userId
// @desc    Check budget and award points if under budget
// @access  Public
router.post('/check-rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all active budgets for user (if no userId specified, get all active budgets)
    const query = { isActive: true };
    if (userId && userId !== 'undefined') {
      query.userId = userId;
    }
    
    const budgets = await Budget.find(query).lean();
    
    // Get user points for response
    const { getUserPoints } = require('../utils/rewardsMongo');
    let totalPoints = 0;
    try {
      totalPoints = await getUserPoints(userId);
    } catch (pointsError) {
      console.warn('Could not get user points:', pointsError.message);
    }
    
    if (budgets.length === 0) {
      return res.json({
        success: true,
        message: 'No active budgets found. Create a budget to start earning points!',
        data: {
          budgetsChecked: [],
          pointsEarned: 0,
          totalPoints: totalPoints,
        },
      });
    }
    
    let totalPointsEarned = 0;
    const checkedBudgets = [];
    
    // Check each budget
    for (const budget of budgets) {
      try {
        const spent = await calculateSpent(budget);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';
        
        // Ensure budget object has category
        const budgetWithCategory = {
          ...budget,
          category: budget.category || 'other'
        };
        
        const budgetProgress = {
          budget: budgetWithCategory,
          spent,
          percentage,
          status,
        };
        
        // Award points if under budget
        let achievement = null;
        try {
          achievement = await checkBudgetAchievement(userId, budgetProgress);
        } catch (achError) {
          console.warn(`Error checking achievement for budget ${budget._id}:`, achError.message);
          // Continue with other budgets even if one fails
        }
        
        if (achievement && achievement.newAchievement) {
          totalPointsEarned += achievement.pointsEarned || 0;
        }
        
        // Update total points after award
        try {
          totalPoints = await getUserPoints(userId);
        } catch (pointsError) {
          // Use previous total if we can't get updated one
        }
        
        checkedBudgets.push({
          budgetId: budget._id.toString(),
          name: budget.name,
          category: normalizeCategory(budget.category || 'other'),
          percentage: parseFloat(percentage.toFixed(2)),
          status,
          pointsEarned: achievement && achievement.newAchievement ? (achievement.pointsEarned || 0) : 0,
        });
      } catch (budgetError) {
        console.error(`Error processing budget ${budget._id}:`, budgetError.message);
        // Continue with other budgets
      }
    }
    
    res.json({
      success: true,
      message: totalPointsEarned > 0 ? `Points awarded for staying under budget! Earned ${totalPointsEarned} points.` : 'No new budget rewards earned (already earned or over budget)',
      data: {
        budgetsChecked: checkedBudgets,
        pointsEarned: totalPointsEarned,
        totalPoints: totalPoints,
      },
    });
  } catch (error) {
    console.error('Check budget rewards error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while checking budget rewards',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, category, amount, period, startDate, endDate, userId } = req.body;

    // Validation
    if (!name || !category || !amount || !period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create budget in MongoDB
    const newBudget = new Budget({
      userId: userId || 'U001', // Default to U001 if not provided
      name,
      category,
      amount: parseFloat(amount),
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    });

    await newBudget.save();

    // Calculate spent amount
    const spent = await calculateSpent(newBudget);
    const remaining = newBudget.amount - spent;
    const percentage = newBudget.amount > 0 ? (spent / newBudget.amount) * 100 : 0;
    const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good';

    res.status(201).json({
      success: true,
      data: {
        id: newBudget._id.toString(),
        userId: newBudget.userId,
        name: newBudget.name,
        category: normalizeCategory(newBudget.category),
        amount: newBudget.amount,
        period: newBudget.period,
        startDate: newBudget.startDate.toISOString().split('T')[0],
        endDate: newBudget.endDate.toISOString().split('T')[0],
        isActive: newBudget.isActive,
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        status,
      },
      message: 'Budget created successfully',
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
