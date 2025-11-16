const mongoose = require('mongoose');

const eventAttendanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  attendedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate attendances
eventAttendanceSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const EventAttendance = mongoose.model('EventAttendance', eventAttendanceSchema);

module.exports = EventAttendance;

