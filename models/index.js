/**
 * Export all database models
 */

const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const Event = require('./Event');
const EventAttendance = require('./EventAttendance');
const ClassAttendance = require('./ClassAttendance');
const ActivityLog = require('./ActivityLog');
const RewardPoints = require('./RewardPoints');
const Streak = require('./Streak');
const Achievement = require('./Achievement');

module.exports = {
  User,
  Transaction,
  Budget,
  Event,
  EventAttendance,
  ClassAttendance,
  ActivityLog,
  RewardPoints,
  Streak,
  Achievement
};

