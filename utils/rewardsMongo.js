/**
 * MongoDB-based rewards helper functions
 * Replaces in-memory rewardsData.js functionality
 */

const { RewardPoints, Streak, Achievement } = require('../models');

// Point values for streaks
const STREAK_POINTS = {
  3: 10,    // 3-day streak
  7: 25,    // 1-week streak
  14: 50,   // 2-week streak
  30: 100,  // 1-month streak
  60: 200,  // 2-month streak
  90: 500,  // 3-month streak
};

// Point values for achievements
const ACHIEVEMENT_POINTS = {
  UNDER_BUDGET: 50,
  ACADEMIC_EVENT: 20,
  FREE_EVENT: 10,
  ACTIVITY_DAY: 5,
  PERFECT_CLASS_ATTENDANCE: 100,
};

// Initialize or get user points
async function initializeUserPoints(userId) {
  let points = await RewardPoints.findOne({ userId });
  if (!points) {
    points = new RewardPoints({ userId, totalPoints: 0 });
    await points.save();
  }
  return points;
}

// Initialize or get user streak
async function initializeUserStreak(userId, streakType) {
  let streak = await Streak.findOne({ userId, streakType });
  if (!streak) {
    streak = new Streak({ userId, streakType, current: 0, longest: 0 });
    await streak.save();
  }
  return streak;
}

// Calculate points for a streak
function calculateStreakPoints(streakLength) {
  let points = 0;
  
  // Check each milestone (from highest to lowest)
  const milestones = Object.keys(STREAK_POINTS).map(Number).sort((a, b) => b - a);
  for (const days of milestones) {
    if (streakLength >= days) {
      points = STREAK_POINTS[days];
      break;
    }
  }
  
  return points;
}

// Update streak and award points if milestone reached
async function updateStreak(userId, streakType, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const streak = await initializeUserStreak(userId, streakType);
  const points = await initializeUserPoints(userId);
  
  const today = new Date(dateStr);
  const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;
  
  // Check if this is a consecutive day
  if (lastDate) {
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      streak.current += 1;
    } else if (daysDiff > 1) {
      // Streak broken - reset
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }
      streak.current = 1;
    }
    // If daysDiff === 0, same day - don't change streak
  } else {
    // First time - start streak
    streak.current = 1;
  }
  
  streak.lastDate = dateStr;
  await streak.save();
  
  // Check for milestone rewards
  const previousStreak = streak.current - 1;
  const previousPoints = calculateStreakPoints(previousStreak);
  const currentPoints = calculateStreakPoints(streak.current);
  
  if (currentPoints > previousPoints) {
    // Milestone reached!
    const pointsEarned = currentPoints - previousPoints;
    points.totalPoints += pointsEarned;
    await points.save();
    return {
      milestone: true,
      streakLength: streak.current,
      pointsEarned,
      totalPoints: points.totalPoints,
    };
  }
  
  return {
    milestone: false,
    streakLength: streak.current,
    pointsEarned: 0,
    totalPoints: points.totalPoints,
  };
}

// Award points for achievement
async function awardAchievement(userId, achievementId, points) {
  const pointsDoc = await initializeUserPoints(userId);
  
  // Check if achievement already exists
  const existing = await Achievement.findOne({ userId, achievementId });
  if (existing) {
    return {
      newAchievement: false,
      pointsEarned: 0,
      totalPoints: pointsDoc.totalPoints,
    };
  }
  
  // Create achievement
  await Achievement.create({
    userId,
    achievementId,
    pointsEarned: points
  });
  
  // Add points
  pointsDoc.totalPoints += points;
  await pointsDoc.save();
  
  return {
    newAchievement: true,
    pointsEarned: points,
    totalPoints: pointsDoc.totalPoints,
  };
}

// Check if user stayed under budget
async function checkBudgetAchievement(userId, budgetProgress) {
  if (budgetProgress.percentage < 100 && budgetProgress.status !== 'exceeded') {
    return await awardAchievement(userId, `UNDER_BUDGET_${budgetProgress.budget.category}`, ACHIEVEMENT_POINTS.UNDER_BUDGET);
  }
  return null;
}

// Award points for attending academic events
async function awardEventPoints(userId, event) {
  if (event.category === 'Academic') {
    return await awardAchievement(userId, `ACADEMIC_EVENT_${event.eventId}`, ACHIEVEMENT_POINTS.ACADEMIC_EVENT);
  }
  if (event.cost === 0 || event.cost === '0') {
    return await awardAchievement(userId, `FREE_EVENT_${event.eventId}`, ACHIEVEMENT_POINTS.FREE_EVENT);
  }
  return null;
}

// Award points for daily activity (only once per day)
async function awardActivityPoints(userId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return await awardAchievement(userId, `ACTIVITY_${dateStr}`, ACHIEVEMENT_POINTS.ACTIVITY_DAY);
}

// Get user points
async function getUserPoints(userId) {
  const points = await initializeUserPoints(userId);
  return points.totalPoints;
}

// Get user streaks
async function getUserStreaks(userId) {
  const streaks = await Streak.find({ userId }).lean();
  
  // Format into expected structure
  const formatted = {
    classAttendance: { current: 0, lastDate: null, longest: 0 },
    activities: { current: 0, lastDate: null, longest: 0 },
    events: { current: 0, lastDate: null, longest: 0 },
  };
  
  streaks.forEach(streak => {
    formatted[streak.streakType] = {
      current: streak.current,
      lastDate: streak.lastDate,
      longest: streak.longest,
    };
  });
  
  return formatted;
}

// Get user achievements
async function getUserAchievements(userId) {
  const achievements = await Achievement.find({ userId }).sort({ earnedAt: -1 }).lean();
  return achievements.map(a => a.achievementId);
}

// Get rewards summary
async function getRewardsSummary(userId) {
  const points = await getUserPoints(userId);
  const streaks = await getUserStreaks(userId);
  const achievements = await getUserAchievements(userId);
  
  // Calculate next milestone for each streak
  const getNextMilestone = (currentStreak) => {
    const milestones = [3, 7, 14, 30, 60, 90];
    for (const milestone of milestones) {
      if (currentStreak < milestone) {
        return {
          days: milestone,
          points: STREAK_POINTS[milestone],
          daysRemaining: milestone - currentStreak,
        };
      }
    }
    return null;
  };
  
  return {
    totalPoints: points,
    streaks: {
      classAttendance: {
        current: streaks.classAttendance.current,
        longest: streaks.classAttendance.longest,
        nextMilestone: getNextMilestone(streaks.classAttendance.current),
      },
      activities: {
        current: streaks.activities.current,
        longest: streaks.activities.longest,
        nextMilestone: getNextMilestone(streaks.activities.current),
      },
      events: {
        current: streaks.events.current,
        longest: streaks.events.longest,
        nextMilestone: getNextMilestone(streaks.events.current),
      },
    },
    achievements: {
      count: achievements.length,
      list: achievements,
    },
  };
}

module.exports = {
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
};

