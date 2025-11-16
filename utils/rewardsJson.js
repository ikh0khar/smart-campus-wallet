/**
 * JSON-based rewards helper functions
 * Works with JSON file database (no MongoDB needed)
 */

const { RewardPoints, Streak, Achievement } = require('../db/json-db');

// Point values for streaks
const STREAK_POINTS = {
  3: 10,    // 3-day streak
  7: 25,    // 1-week streak
  14: 50,   // 2-week streak
  30: 100,  // 1-month streak
  60: 200,  // 2-month streak
  90: 500,  // 3-month streak
};

// Point values for activities
const ACTIVITY_POINTS = {
  CLASS_ATTENDANCE: 200,      // Points for attending class
  PHYSICAL_ACTIVITY: 100,     // Points for physical activities (gym, sports, walk, run)
  PAID_EVENT: 300,            // Points for paid events
  FREE_EVENT: 150,            // Points for free events
  BUDGET_CHECK: 50,           // Points for staying under budget
};

// Point values for achievements (legacy)
const ACHIEVEMENT_POINTS = {
  UNDER_BUDGET: 50,
  ACADEMIC_EVENT: 300,
  FREE_EVENT: 150,
  ACTIVITY_DAY: 100,
  PERFECT_CLASS_ATTENDANCE: 200,
};

// Initialize or get user points
async function initializeUserPoints(userId) {
  const points = await RewardPoints.findOne({ userId });
  if (!points) {
    return await RewardPoints.create({ userId, totalPoints: 0, updatedAt: new Date() });
  }
  return points;
}

// Initialize or get user streak
async function initializeUserStreak(userId, streakType) {
  const streak = await Streak.findOne({ userId, streakType });
  if (!streak) {
    return await Streak.create({ userId, streakType, current: 0, longest: 0, lastDate: null });
  }
  return streak;
}

// Calculate points for a streak
function calculateStreakPoints(streakLength) {
  let points = 0;
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
  const streakDoc = await initializeUserStreak(userId, streakType);
  const pointsDoc = await initializeUserPoints(userId);
  
  // Convert to plain objects
  const streak = typeof streakDoc === 'object' && streakDoc.lean ? streakDoc.lean() : streakDoc;
  const points = typeof pointsDoc === 'object' && pointsDoc.lean ? pointsDoc.lean() : pointsDoc;
  
  const today = new Date(dateStr);
  const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;
  
  let newStreak = streak.current || 0;
  let milestone = null;
  
  // Check if this is a consecutive day
  if (lastDate) {
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      newStreak = (streak.current || 0) + 1;
    } else if (daysDiff > 1) {
      if ((streak.current || 0) > (streak.longest || 0)) {
        await Streak.findByIdAndUpdate(streak._id, { longest: streak.current || 0 });
      }
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }
  
  // Check for milestone
  const previousMilestone = calculateStreakPoints(streak.current || 0);
  const newMilestone = calculateStreakPoints(newStreak);
  
  if (newMilestone > previousMilestone) {
    milestone = `${streakType}_${newMilestone}day`;
  }
  
  // Update streak
  await Streak.findByIdAndUpdate(streak._id, {
    current: newStreak,
    longest: Math.max(newStreak, streak.longest || 0),
    lastDate: dateStr
  });
  
  // Award points if milestone reached
  let pointsEarned = 0;
  if (milestone) {
    pointsEarned = newMilestone - previousMilestone;
    const newTotal = (points.totalPoints || 0) + pointsEarned;
    await RewardPoints.findByIdAndUpdate(points._id, { totalPoints: newTotal, updatedAt: new Date() });
  }
  
  const updatedStreak = await Streak.findById(streak._id);
  const updatedPoints = await RewardPoints.findById(points._id);
  
  return {
    streakLength: newStreak,
    longestStreak: Math.max(newStreak, streak.longest || 0),
    pointsEarned,
    totalPoints: updatedPoints?.totalPoints || points?.totalPoints || 0,
    milestone
  };
}

// Award achievement (used for activities)
async function awardAchievement(userId, achievementId, points) {
  // Check if achievement already exists
  const existing = await Achievement.findOne({ userId, achievementId });
  if (existing) {
    const pointsDoc = await initializeUserPoints(userId);
    return {
      newAchievement: false,
      pointsEarned: existing.pointsEarned || 0,
      totalPoints: pointsDoc.totalPoints || 0
    };
  }
  
  // Create new achievement
  await Achievement.create({
    userId,
    achievementId,
    pointsEarned: points,
    earnedAt: new Date()
  });
  
  // Update user points
  const pointsDoc = await initializeUserPoints(userId);
  const newTotal = (pointsDoc.totalPoints || 0) + points;
  await RewardPoints.findByIdAndUpdate(pointsDoc._id, { totalPoints: newTotal, updatedAt: new Date() });
  
  return {
    newAchievement: true,
    pointsEarned: points,
    totalPoints: newTotal
  };
}

// Check budget achievement
async function checkBudgetAchievement(userId, budgetProgress) {
  if (budgetProgress.percentage < 100 && budgetProgress.status !== 'exceeded') {
    return await awardAchievement(userId, `UNDER_BUDGET_${budgetProgress.budget.category}`, ACTIVITY_POINTS.BUDGET_CHECK);
  }
  return null;
}

// Award event points
async function awardEventPoints(userId, event) {
  if (event.category === 'Academic') {
    return await awardAchievement(userId, `ACADEMIC_EVENT_${event.eventId}`, ACTIVITY_POINTS.PAID_EVENT);
  }
  const eventCost = parseFloat(event.cost) || 0;
  if (eventCost > 0) {
    return await awardAchievement(userId, `PAID_EVENT_${event.eventId}`, ACTIVITY_POINTS.PAID_EVENT);
  }
  if (eventCost === 0 || event.cost === '0') {
    return await awardAchievement(userId, `FREE_EVENT_${event.eventId}`, ACTIVITY_POINTS.FREE_EVENT);
  }
  return null;
}

// Award activity points
async function awardActivityPoints(userId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return await awardAchievement(userId, `ACTIVITY_${dateStr}`, ACTIVITY_POINTS.PHYSICAL_ACTIVITY);
}

// Award class attendance points
async function awardClassAttendancePoints(userId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  return await awardAchievement(userId, `CLASS_ATTENDANCE_${dateStr}`, ACTIVITY_POINTS.CLASS_ATTENDANCE);
}

// Get user points
async function getUserPoints(userId) {
  const points = await initializeUserPoints(userId);
  const pointsData = points.lean ? await points.lean() : points;
  return pointsData.totalPoints || 0;
}

// Get user streaks
async function getUserStreaks(userId) {
  const findResult = await Streak.find({ userId });
  const streaksData = await findResult.lean();
  
  const result = {};
  streaksData.forEach(streak => {
    result[streak.streakType] = {
      current: streak.current || 0,
      longest: streak.longest || 0,
      lastDate: streak.lastDate || null
    };
  });
  
  return result;
}

// Get user achievements
async function getUserAchievements(userId) {
  const achievements = await Achievement.find({ userId });
  const achievementsData = achievements.lean ? await achievements.lean() : await achievements;
  return achievementsData.sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0));
}

// Get points breakdown
async function getPointsBreakdown(userId) {
  const achievements = await Achievement.find({ userId });
  const achievementsData = achievements.lean ? await achievements.lean() : await achievements;
  
  const breakdown = {
    classAttendance: 0,
    physicalActivities: 0,
    paidEvents: 0,
    freeEvents: 0,
    budgetChecks: 0,
    total: 0
  };
  
  achievementsData.forEach(achievement => {
    const achievementId = achievement.achievementId || '';
    const points = achievement.pointsEarned || 0;
    
    if (achievementId.startsWith('CLASS_ATTENDANCE_')) {
      breakdown.classAttendance += points;
    } else if (achievementId.startsWith('ACTIVITY_')) {
      breakdown.physicalActivities += points;
    } else if (achievementId.startsWith('PAID_EVENT_') || achievementId.startsWith('ACADEMIC_EVENT_')) {
      breakdown.paidEvents += points;
    } else if (achievementId.startsWith('FREE_EVENT_')) {
      breakdown.freeEvents += points;
    } else if (achievementId.startsWith('UNDER_BUDGET_')) {
      breakdown.budgetChecks += points;
    }
    breakdown.total += points;
  });
  
  return breakdown;
}

// Get rewards summary
async function getRewardsSummary(userId) {
  const points = await getUserPoints(userId);
  const streaks = await getUserStreaks(userId);
  const achievements = await getUserAchievements(userId);
  const pointsBreakdown = await getPointsBreakdown(userId);
  
  // Calculate gift card eligibility
  const giftCard200 = Math.floor(points / 200);
  const giftCard1000 = Math.floor(points / 1000);
  const fireTier = points >= 10000;
  
  // Calculate Fire Tier point costs (half points when in Fire Tier)
  const fireTierMultiplier = fireTier ? 0.5 : 1;
  
  return {
    totalPoints: points,
    pointsBreakdown,
    streaks,
    achievements: achievements.slice(0, 10), // Latest 10
    giftCard200,
    giftCard1000,
    fireTier,
    fireTierMultiplier
  };
}

module.exports = {
  updateStreak,
  awardAchievement,
  checkBudgetAchievement,
  awardEventPoints,
  awardActivityPoints,
  awardClassAttendancePoints,
  getUserPoints,
  getUserStreaks,
  getUserAchievements,
  getRewardsSummary,
  getPointsBreakdown,
  STREAK_POINTS,
  ACHIEVEMENT_POINTS,
  ACTIVITY_POINTS
};

