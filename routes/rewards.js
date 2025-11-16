const express = require('express');
const router = express.Router();
const {
  updateStreak,
  awardAchievement,
  checkBudgetAchievement,
  awardEventPoints,
  awardActivityPoints,
  getUserPoints,
  getUserStreaks,
  getUserAchievements,
  getRewardsSummary,
  STREAK_POINTS,
  ACHIEVEMENT_POINTS,
} = require('../utils/rewardsMongo');

// ============================================
// POINTS ENDPOINTS
// ============================================

// @route   GET /api/rewards/points/:userId
// @desc    Get user's total points
// @access  Public
router.get('/points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const points = await getUserPoints(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        totalPoints: points,
      },
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// STREAKS ENDPOINTS
// ============================================

// @route   GET /api/rewards/streaks/:userId
// @desc    Get user's streaks
// @access  Public
router.get('/streaks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const streaks = await getUserStreaks(userId);
    
    // Calculate next milestones
    const getNextMilestone = (current) => {
      const milestones = [3, 7, 14, 30, 60, 90];
      for (const milestone of milestones) {
        if (current < milestone) {
          return {
            days: milestone,
            points: STREAK_POINTS[milestone],
            daysRemaining: milestone - current,
          };
        }
      }
      return null;
    };
    
    const formattedStreaks = {
      classAttendance: {
        current: streaks.classAttendance.current,
        longest: streaks.classAttendance.longest,
        lastDate: streaks.classAttendance.lastDate,
        nextMilestone: getNextMilestone(streaks.classAttendance.current),
      },
      activities: {
        current: streaks.activities.current,
        longest: streaks.activities.longest,
        lastDate: streaks.activities.lastDate,
        nextMilestone: getNextMilestone(streaks.activities.current),
      },
      events: {
        current: streaks.events.current,
        longest: streaks.events.longest,
        lastDate: streaks.events.lastDate,
        nextMilestone: getNextMilestone(streaks.events.current),
      },
    };
    
    res.json({
      success: true,
      data: formattedStreaks,
    });
  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/rewards/streaks/:userId/update
// @desc    Update streak (called when user logs activity/attendance)
// @access  Public
router.post('/streaks/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { streakType, date } = req.body;
    
    if (!streakType) {
      return res.status(400).json({
        success: false,
        message: 'streakType is required (classAttendance, activities, or events)',
      });
    }
    
    const validTypes = ['classAttendance', 'activities', 'events'];
    if (!validTypes.includes(streakType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid streakType. Must be one of: ${validTypes.join(', ')}`,
      });
    }
    
    const result = await updateStreak(userId, streakType, date);
    
    res.json({
      success: true,
      data: {
        streakType,
        streakLength: result.streakLength,
        milestoneReached: result.milestone,
        pointsEarned: result.pointsEarned,
        totalPoints: result.totalPoints,
      },
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// ACHIEVEMENTS ENDPOINTS
// ============================================

// @route   GET /api/rewards/achievements/:userId
// @desc    Get user's achievements
// @access  Public
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = await getUserAchievements(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        count: achievements.length,
        achievements,
      },
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// REWARDS SUMMARY ENDPOINT
// ============================================

// @route   GET /api/rewards/summary/:userId
// @desc    Get complete rewards summary (points, streaks, achievements)
// @access  Public
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await getRewardsSummary(userId);
    
    // Format for charts
    const streakChartData = [
      { label: 'Class Attendance', value: summary.streaks.classAttendance.current, color: '#3b82f6' },
      { label: 'Activities', value: summary.streaks.activities.current, color: '#10b981' },
      { label: 'Events', value: summary.streaks.events.current, color: '#f59e0b' },
    ];
    
    res.json({
      success: true,
      data: {
        ...summary,
        chartData: streakChartData,
      },
    });
  } catch (error) {
    console.error('Get rewards summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// POINT VALUES ENDPOINT
// ============================================

// @route   GET /api/rewards/point-values
// @desc    Get point values for streaks and achievements
// @access  Public
router.get('/point-values', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        streakPoints: STREAK_POINTS,
        achievementPoints: ACHIEVEMENT_POINTS,
      },
    });
  } catch (error) {
    console.error('Get point values error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
