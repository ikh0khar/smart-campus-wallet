const express = require('express');
const router = express.Router();
const { MealPlan } = require('../db/json-db');

// Initialize meal plan for user if it doesn't exist
async function initializeMealPlan(userId) {
  const existing = await MealPlan.findOne({ userId });
  if (!existing) {
    const mealPlan = {
      _id: `mealplan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      totalSwipes: 220,
      remainingSwipes: 220,
      usedSwipes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await MealPlan.create(mealPlan);
    return mealPlan;
  }
  return existing;
}

// @route   GET /api/meal-plans/:userId
// @desc    Get meal plan for user
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get or create meal plan for user
    let mealPlan = await MealPlan.findOne({ userId });
    
    if (!mealPlan) {
      // Initialize with 220 swipes for demo
      mealPlan = await initializeMealPlan(userId);
    }
    
    res.json({
      success: true,
      data: {
        userId: mealPlan.userId,
        totalSwipes: mealPlan.totalSwipes,
        remainingSwipes: mealPlan.remainingSwipes,
        usedSwipes: mealPlan.usedSwipes || 0,
        updatedAt: mealPlan.updatedAt
      }
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching meal plan'
    });
  }
});

// @route   POST /api/meal-plans/:userId/use-swipe
// @desc    Use a meal swipe (deduct one swipe)
// @access  Public
router.post('/:userId/use-swipe', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get or create meal plan for user
    let mealPlan = await MealPlan.findOne({ userId });
    
    if (!mealPlan) {
      mealPlan = await initializeMealPlan(userId);
    }
    
    // Check if user has remaining swipes
    if (mealPlan.remainingSwipes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining meal swipes available'
      });
    }
    
    // Deduct one swipe
    const updatedMealPlan = {
      ...mealPlan,
      remainingSwipes: Math.max(0, mealPlan.remainingSwipes - 1),
      usedSwipes: (mealPlan.usedSwipes || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    
    await MealPlan.findByIdAndUpdate(mealPlan._id, updatedMealPlan);
    
    res.json({
      success: true,
      message: 'Meal swipe used successfully',
      data: {
        userId: updatedMealPlan.userId,
        totalSwipes: updatedMealPlan.totalSwipes,
        remainingSwipes: updatedMealPlan.remainingSwipes,
        usedSwipes: updatedMealPlan.usedSwipes,
        updatedAt: updatedMealPlan.updatedAt
      }
    });
  } catch (error) {
    console.error('Use meal swipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while using meal swipe'
    });
  }
});

// @route   POST /api/meal-plans/:userId/reset
// @desc    Reset meal plan to initial state (for demo/testing)
// @access  Public
router.post('/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const mealPlan = {
      userId: userId,
      totalSwipes: 220,
      remainingSwipes: 220,
      usedSwipes: 0,
      updatedAt: new Date().toISOString()
    };
    
    const existing = await MealPlan.findOne({ userId });
    if (existing) {
      await MealPlan.findByIdAndUpdate(existing._id, mealPlan);
    } else {
      await initializeMealPlan(userId);
    }
    
    res.json({
      success: true,
      message: 'Meal plan reset to 220 swipes',
      data: mealPlan
    });
  } catch (error) {
    console.error('Reset meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting meal plan'
    });
  }
});

module.exports = router;
