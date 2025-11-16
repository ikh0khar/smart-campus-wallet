const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  streakType: {
    type: String,
    required: true,
    enum: ['classAttendance', 'activities', 'events'],
    index: true
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  longest: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDate: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
streakSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to prevent duplicates
streakSchema.index({ userId: 1, streakType: 1 }, { unique: true });

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;

