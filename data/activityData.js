// In-memory storage for user activity data
// In production, this would be in a database

const userEventAttendance = {}; // { userId: [eventIds] }
const userClassAttendance = {}; // { userId: { totalDays: 0, attendedDays: 0, dates: [] } }
const userActivityLogs = {}; // { userId: { gym: [], sports: [], walk: [], run: [] } }

// Initialize user data structures
function initializeUser(userId) {
  if (!userEventAttendance[userId]) {
    userEventAttendance[userId] = [];
  }
  if (!userClassAttendance[userId]) {
    userClassAttendance[userId] = {
      totalDays: 0,
      attendedDays: 0,
      dates: [],
    };
  }
  if (!userActivityLogs[userId]) {
    userActivityLogs[userId] = {
      gym: [],
      sports: [],
      walk: [],
      run: [],
    };
  }
}

// Event attendance functions
function getUserAttendedEvents(userId) {
  initializeUser(userId);
  return userEventAttendance[userId] || [];
}

function logEventAttendance(userId, eventId) {
  initializeUser(userId);
  if (!userEventAttendance[userId].includes(eventId)) {
    userEventAttendance[userId].push(eventId);
  }
  return userEventAttendance[userId];
}

function removeEventAttendance(userId, eventId) {
  initializeUser(userId);
  userEventAttendance[userId] = userEventAttendance[userId].filter(id => id !== eventId);
  return userEventAttendance[userId];
}

// Class attendance functions
function getClassAttendance(userId) {
  initializeUser(userId);
  return userClassAttendance[userId];
}

function logClassAttendance(userId, date) {
  initializeUser(userId);
  const dateStr = date || new Date().toISOString().split('T')[0];
  
  if (!userClassAttendance[userId].dates.includes(dateStr)) {
    userClassAttendance[userId].dates.push(dateStr);
    userClassAttendance[userId].attendedDays = userClassAttendance[userId].dates.length;
  }
  
  return userClassAttendance[userId];
}

function setTotalClassDays(userId, totalDays) {
  initializeUser(userId);
  userClassAttendance[userId].totalDays = totalDays;
  return userClassAttendance[userId];
}

// Activity/Gym logging functions
function getActivityLogs(userId) {
  initializeUser(userId);
  return userActivityLogs[userId];
}

function logActivity(userId, activityType, date) {
  initializeUser(userId);
  const dateStr = date || new Date().toISOString().split('T')[0];
  
  const validTypes = ['gym', 'sports', 'walk', 'run'];
  if (!validTypes.includes(activityType)) {
    throw new Error(`Invalid activity type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  if (!userActivityLogs[userId][activityType].includes(dateStr)) {
    userActivityLogs[userId][activityType].push(dateStr);
  }
  
  return userActivityLogs[userId];
}

function getActivitySummary(userId) {
  initializeUser(userId);
  const logs = userActivityLogs[userId];
  
  return {
    gym: {
      count: logs.gym.length,
      dates: logs.gym,
    },
    sports: {
      count: logs.sports.length,
      dates: logs.sports,
    },
    walk: {
      count: logs.walk.length,
      dates: logs.walk,
    },
    run: {
      count: logs.run.length,
      dates: logs.run,
    },
    total: logs.gym.length + logs.sports.length + logs.walk.length + logs.run.length,
  };
}

module.exports = {
  getUserAttendedEvents,
  logEventAttendance,
  removeEventAttendance,
  getClassAttendance,
  logClassAttendance,
  setTotalClassDays,
  getActivityLogs,
  logActivity,
  getActivitySummary,
};

