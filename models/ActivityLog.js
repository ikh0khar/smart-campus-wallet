const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['gym', 'sports', 'walk', 'run'],
    index: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate logs for same user/activity/date
activityLogSchema.index({ userId: 1, activityType: 1, date: 1 }, { unique: true });
activityLogSchema.index({ userId: 1, date: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;

