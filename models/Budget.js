const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'semester'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
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
budgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
budgetSchema.index({ userId: 1, isActive: 1 });
budgetSchema.index({ category: 1, isActive: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;

