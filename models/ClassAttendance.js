const mongoose = require('mongoose');

const classAttendanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true,
    unique: true
  },
  totalDays: {
    type: Number,
    default: 0,
    min: 0
  },
  attendedDays: {
    type: Number,
    default: 0,
    min: 0
  },
  dates: {
    type: [String],
    default: []
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
classAttendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ClassAttendance = mongoose.model('ClassAttendance', classAttendanceSchema);

module.exports = ClassAttendance;

