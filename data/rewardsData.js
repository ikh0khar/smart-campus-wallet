// Rewards and Incentives data storage
// In production, this would be in a database

const userPoints = {}; // { userId: totalPoints }
const userStreaks = {}; // { userId: { classAttendance: { current: 0, lastDate: null }, activities: { current: 0, lastDate: null } } }
const userAchievements = {}; // { userId: [achievementIds] }

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

// Initialize user rewards data
function initializeUser(userId) {
  if (!userPoints[userId]) {
    userPoints[userId] = 0;
  }
  if (!userStreaks[userId]) {
    userStreaks[userId] = {
      classAttendance: { current: 0, lastDate: null, longest: 0 },
      activities: { current: 0, lastDate: null, longest: 0 },
      events: { current: 0, lastDate: null, longest: 0 },
    };
  }
  if (!userAchievements[userId]) {
    userAchievements[userId] = [];
  }
}

// Calculate points for a streak
function calculateStreakPoints(streakLength) {
  let points = 0;
  
  // Check each milestone
  for (const [days, pointValue] of Object.entries(STREAK_POINTS).sort((a, b) => b[0] - a[0])) {
    if (streakLength >= parseInt(days)) {
      points = pointValue;
      break;
    }
  }
  
  return points;
}

// Update streak and award points if milestone reached
function updateStreak(userId, streakType, date) {
  initializeUser(userId);
  const streak = userStreaks[userId][streakType];
  const dateStr = date || new Date().toISOString().split('T')[0];
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
  
  // Check for milestone rewards
  const previousStreak = streak.current - 1;
  const previousPoints = calculateStreakPoints(previousStreak);
  const currentPoints = calculateStreakPoints(streak.current);
  
  if (currentPoints > previousPoints) {
    // Milestone reached!
    const pointsEarned = currentPoints - previousPoints;
    userPoints[userId] += pointsEarned;
    return {
      milestone: true,
      streakLength: streak.current,
      pointsEarned,
      totalPoints: userPoints[userId],
    };
  }
  
  return {
    milestone: false,
    streakLength: streak.current,
    pointsEarned: 0,
    totalPoints: userPoints[userId],
  };
}

// Award points for achievement
function awardAchievement(userId, achievementId, points) {
  initializeUser(userId);
  
  if (!userAchievements[userId].includes(achievementId)) {
    userAchievements[userId].push(achievementId);
    userPoints[userId] += points;
    return {
      newAchievement: true,
      pointsEarned: points,
      totalPoints: userPoints[userId],
    };
  }
  
  return {
    newAchievement: false,
    pointsEarned: 0,
    totalPoints: userPoints[userId],
  };
}

// Check if user stayed under budget
function checkBudgetAchievement(userId, budgetProgress) {
  if (budgetProgress.percentage < 100 && budgetProgress.status !== 'exceeded') {
    return awardAchievement(userId, `UNDER_BUDGET_${budgetProgress.budget.category}`, ACHIEVEMENT_POINTS.UNDER_BUDGET);
  }
  return null;
}

// Award points for attending academic events
function awardEventPoints(userId, event) {
  if (event.category === 'Academic') {
    return awardAchievement(userId, `ACADEMIC_EVENT_${event.eventId}`, ACHIEVEMENT_POINTS.ACADEMIC_EVENT);
  }
  if (event.cost === 0 || event.cost === '0') {
    return awardAchievement(userId, `FREE_EVENT_${event.eventId}`, ACHIEVEMENT_POINTS.FREE_EVENT);
  }
  return null;
}

// Award points for daily activity (only once per day)
function awardActivityPoints(userId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return awardAchievement(userId, `ACTIVITY_${dateStr}`, ACHIEVEMENT_POINTS.ACTIVITY_DAY);
}

// Get user points
function getUserPoints(userId) {
  initializeUser(userId);
  return userPoints[userId];
}

// Get user streaks
function getUserStreaks(userId) {
  initializeUser(userId);
  return userStreaks[userId];
}

// Get user achievements
function getUserAchievements(userId) {
  initializeUser(userId);
  return userAchievements[userId];
}

// Get rewards summary
function getRewardsSummary(userId) {
  initializeUser(userId);
  const streaks = getUserStreaks(userId);
  const points = getUserPoints(userId);
  const achievements = getUserAchievements(userId);
  
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

