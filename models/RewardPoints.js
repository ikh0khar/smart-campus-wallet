const mongoose = require('mongoose');

const rewardPointsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
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
rewardPointsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RewardPoints = mongoose.model('RewardPoints', rewardPointsSchema);

module.exports = RewardPoints;

