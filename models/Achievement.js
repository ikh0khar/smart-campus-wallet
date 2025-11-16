const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  achievementId: {
    type: String,
    required: true,
    trim: true
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate achievements
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
achievementSchema.index({ userId: 1, earnedAt: -1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;

