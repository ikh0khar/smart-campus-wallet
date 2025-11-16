const express = require('express');
const router = express.Router();
const { Event, EventAttendance, ClassAttendance, ActivityLog } = require('../models');
const { updateStreak, awardEventPoints, awardActivityPoints, awardClassAttendancePoints } = require('../utils/rewardsMongo');

// ============================================
// EVENTS ENDPOINTS
// ============================================

// @route   GET /api/activities/events
// @desc    Get all campus events
// @access  Public
router.get('/events', async (req, res) => {
  try {
    const { category, isFree, userId } = req.query;

    // Build MongoDB query
    const query = {};
    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    // Get events from MongoDB
    let events = await Event.find(query).lean();

    // Filter by free/paid
    if (isFree !== undefined) {
      const freeFilter = isFree === 'true';
      events = events.filter(e => (e.cost === 0 || e.cost === '0') === freeFilter);
    }

    // Add attendance status if userId provided
    if (userId) {
      const attendedEvents = await EventAttendance.find({ userId }).distinct('eventId');
      events = events.map(event => ({
        ...event,
        eventId: event.eventId, // Keep original eventId
        isAttending: attendedEvents.includes(event.eventId),
        isFree: event.cost === 0 || event.cost === '0',
      }));
    } else {
      events = events.map(event => ({
        ...event,
        isFree: event.cost === 0 || event.cost === '0',
      }));
    }

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/activities/events/:eventId
// @desc    Get single event details
// @access  Public
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query;
    
    const event = await Event.findOne({ eventId }).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const eventData = {
      ...event,
      isFree: event.cost === 0 || event.cost === '0',
    };

    // Add attendance status if userId provided
    if (userId) {
      const attendance = await EventAttendance.findOne({ userId, eventId });
      eventData.isAttending = !!attendance;
    }

    res.json({
      success: true,
      data: eventData,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/activities/events/user/:userId
// @desc    Get events user is attending
// @access  Public
router.get('/events/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get attended event IDs from MongoDB
    const attendedEventIds = await EventAttendance.find({ userId }).distinct('eventId');
    
    // Get event details
    const attendedEvents = await Event.find({ eventId: { $in: attendedEventIds } }).lean();

    const formattedEvents = attendedEvents.map(event => ({
        ...event,
        isFree: event.cost === 0 || event.cost === '0',
        isAttending: true,
      }));

    res.json({
      success: true,
      count: formattedEvents.length,
      data: formattedEvents,
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/activities/events/:eventId/attend
// @desc    Log event attendance
// @access  Public
router.post('/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Verify event exists
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Create or check attendance
    let attendance;
    try {
      attendance = await EventAttendance.findOneAndUpdate(
        { userId, eventId },
        { userId, eventId, attendedAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        // Already attending
        attendance = await EventAttendance.findOne({ userId, eventId });
      } else {
        throw error;
      }
    }

    // Get all attended events
    const attendedEventIds = await EventAttendance.find({ userId }).distinct('eventId');

    // Update event streak and award points
    const streakResult = await updateStreak(userId, 'events', new Date().toISOString().split('T')[0]);
    let eventPoints = null;
    if (event) {
      eventPoints = await awardEventPoints(userId, event.toObject());
    }

    res.json({
      success: true,
      message: 'Event attendance logged',
      data: {
        eventId,
        userId,
        attendedEvents: attendedEventIds,
        rewards: {
          streakUpdated: streakResult.milestone,
          streakLength: streakResult.streakLength,
          pointsEarned: streakResult.pointsEarned + (eventPoints?.pointsEarned || 0),
          totalPoints: streakResult.totalPoints + (eventPoints?.pointsEarned || 0),
        },
      },
    });
  } catch (error) {
    console.error('Log event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/activities/events/:eventId/attend
// @desc    Remove event attendance
// @access  Public
router.delete('/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Remove attendance from MongoDB
    await EventAttendance.deleteOne({ userId, eventId });

    // Get remaining attended events
    const attendedEventIds = await EventAttendance.find({ userId }).distinct('eventId');

    res.json({
      success: true,
      message: 'Event attendance removed',
      data: {
        eventId,
        userId,
        attendedEvents: attendedEventIds,
      },
    });
  } catch (error) {
    console.error('Remove event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// CLASS ATTENDANCE ENDPOINTS
// ============================================

// @route   GET /api/activities/class-attendance/:userId
// @desc    Get class attendance stats
// @access  Public
router.get('/class-attendance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get or create class attendance
    let attendance = await ClassAttendance.findOne({ userId });
    if (!attendance) {
      attendance = new ClassAttendance({ userId });
      await attendance.save();
    }

    // Calculate attendance percentage
    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    res.json({
      success: true,
      data: {
        userId: attendance.userId,
        totalDays: attendance.totalDays,
        attendedDays: attendance.attendedDays,
        dates: attendance.dates,
        percentage: parseFloat(percentage.toFixed(2)),
        // Chart-friendly format
        chartData: [
          { label: 'Attended', value: attendance.attendedDays, color: '#10b981' },
          { label: 'Missed', value: attendance.totalDays - attendance.attendedDays, color: '#ef4444' },
        ],
      },
    });
  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/activities/class-attendance/:userId
// @desc    Log class attendance for a day
// @access  Public
router.post('/class-attendance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.body;

    const dateStr = date || new Date().toISOString().split('T')[0];

    // Get or create class attendance
    let attendance = await ClassAttendance.findOne({ userId });
    if (!attendance) {
      attendance = new ClassAttendance({ userId });
    }

    // Add date if not already present
    if (!attendance.dates.includes(dateStr)) {
      attendance.dates.push(dateStr);
      attendance.attendedDays = attendance.dates.length;
      await attendance.save();
    }

    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    // Update class attendance streak
    const streakResult = await updateStreak(userId, 'classAttendance', dateStr);
    
    // Award points for class attendance (200 points)
    const classPoints = await awardClassAttendancePoints(userId, dateStr);
    const totalPointsEarned = (streakResult.pointsEarned || 0) + (classPoints?.pointsEarned || 0);
    const finalTotalPoints = classPoints?.totalPoints || streakResult.totalPoints;

    res.json({
      success: true,
      message: 'Class attendance logged',
      data: {
        userId: attendance.userId,
        totalDays: attendance.totalDays,
        attendedDays: attendance.attendedDays,
        dates: attendance.dates,
        percentage: parseFloat(percentage.toFixed(2)),
        rewards: {
          streakUpdated: streakResult.milestone,
          streakLength: streakResult.streakLength,
          pointsEarned: totalPointsEarned,
          totalPoints: finalTotalPoints,
        },
      },
    });
  } catch (error) {
    console.error('Log class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/activities/class-attendance/:userId/total
// @desc    Set total class days
// @access  Public
router.put('/class-attendance/:userId/total', async (req, res) => {
  try {
    const { userId } = req.params;
    const { totalDays } = req.body;

    if (totalDays === undefined || totalDays < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalDays must be a positive number',
      });
    }

    // Get or create class attendance
    let attendance = await ClassAttendance.findOne({ userId });
    if (!attendance) {
      attendance = new ClassAttendance({ userId });
    }

    attendance.totalDays = totalDays;
    await attendance.save();

    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    res.json({
      success: true,
      message: 'Total class days updated',
      data: {
        userId: attendance.userId,
        totalDays: attendance.totalDays,
        attendedDays: attendance.attendedDays,
        dates: attendance.dates,
        percentage: parseFloat(percentage.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Set total class days error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ============================================
// ACTIVITY/GYM LOGGING ENDPOINTS
// ============================================

// @route   GET /api/activities/logs/:userId
// @desc    Get all activity logs for user
// @access  Public
router.get('/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all activity logs from MongoDB
    const logs = await ActivityLog.find({ userId }).lean();
    
    // Group by activity type
    const groupedLogs = {
      gym: [],
      sports: [],
      walk: [],
      run: []
    };
    
    logs.forEach(log => {
      if (groupedLogs[log.activityType]) {
        groupedLogs[log.activityType].push(log.date);
      }
    });

    // Calculate summary
    const summary = {
      gym: {
        count: groupedLogs.gym.length,
        dates: groupedLogs.gym,
      },
      sports: {
        count: groupedLogs.sports.length,
        dates: groupedLogs.sports,
      },
      walk: {
        count: groupedLogs.walk.length,
        dates: groupedLogs.walk,
      },
      run: {
        count: groupedLogs.run.length,
        dates: groupedLogs.run,
      },
      total: groupedLogs.gym.length + groupedLogs.sports.length + groupedLogs.walk.length + groupedLogs.run.length,
    };

    res.json({
      success: true,
      data: {
        logs: groupedLogs,
        summary,
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/activities/logs/:userId
// @desc    Log an activity (gym, sports, walk, run)
// @access  Public
router.post('/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityType, date } = req.body;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        message: 'activityType is required (gym, sports, walk, or run)',
      });
    }

    const validTypes = ['gym', 'sports', 'walk', 'run'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid activity type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];

    // Create activity log in MongoDB
    try {
      await ActivityLog.findOneAndUpdate(
        { userId, activityType, date: dateStr },
        { userId, activityType, date: dateStr },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key errors
        throw error;
      }
    }

    // Get all logs for summary
    const allLogs = await ActivityLog.find({ userId }).lean();
    const groupedLogs = {
      gym: [],
      sports: [],
      walk: [],
      run: []
    };
    
    allLogs.forEach(log => {
      if (groupedLogs[log.activityType]) {
        groupedLogs[log.activityType].push(log.date);
      }
    });

    const summary = {
      gym: {
        count: groupedLogs.gym.length,
        dates: groupedLogs.gym,
      },
      sports: {
        count: groupedLogs.sports.length,
        dates: groupedLogs.sports,
      },
      walk: {
        count: groupedLogs.walk.length,
        dates: groupedLogs.walk,
      },
      run: {
        count: groupedLogs.run.length,
        dates: groupedLogs.run,
      },
      total: groupedLogs.gym.length + groupedLogs.sports.length + groupedLogs.walk.length + groupedLogs.run.length,
    };

    // Update activity streak and award points
    const streakResult = await updateStreak(userId, 'activities', dateStr);
    const activityPoints = await awardActivityPoints(userId, dateStr);

    res.json({
      success: true,
      message: `${activityType} activity logged`,
      data: {
        activityType,
        logs: groupedLogs,
        summary,
        rewards: {
          streakUpdated: streakResult.milestone,
          streakLength: streakResult.streakLength,
          pointsEarned: streakResult.pointsEarned + (activityPoints?.pointsEarned || 0),
          totalPoints: streakResult.totalPoints + (activityPoints?.pointsEarned || 0),
        },
      },
    });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/activities/summary/:userId
// @desc    Get complete activity summary for dashboard
// @access  Public
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all data from MongoDB
    const attendedEventIds = await EventAttendance.find({ userId }).distinct('eventId');
    const attendedEvents = await Event.find({ eventId: { $in: attendedEventIds } }).lean();

    const classAttendance = await ClassAttendance.findOne({ userId });
    const classAttendanceData = classAttendance || { totalDays: 0, attendedDays: 0, dates: [] };

    // Get activity logs
    const activityLogs = await ActivityLog.find({ userId }).lean();
    const groupedLogs = {
      gym: [],
      sports: [],
      walk: [],
      run: []
    };
    
    activityLogs.forEach(log => {
      if (groupedLogs[log.activityType]) {
        groupedLogs[log.activityType].push(log.date);
      }
    });

    const activitySummary = {
      gym: {
        count: groupedLogs.gym.length,
        dates: groupedLogs.gym,
      },
      sports: {
        count: groupedLogs.sports.length,
        dates: groupedLogs.sports,
      },
      walk: {
        count: groupedLogs.walk.length,
        dates: groupedLogs.walk,
      },
      run: {
        count: groupedLogs.run.length,
        dates: groupedLogs.run,
      },
      total: groupedLogs.gym.length + groupedLogs.sports.length + groupedLogs.walk.length + groupedLogs.run.length,
    };

    // Calculate class attendance percentage
    const classPercentage = classAttendanceData.totalDays > 0
      ? (classAttendanceData.attendedDays / classAttendanceData.totalDays) * 100
      : 0;

    // Chart data for activities
    const activityChartData = [
      { label: 'Gym', value: activitySummary.gym.count, color: '#3b82f6' },
      { label: 'Sports', value: activitySummary.sports.count, color: '#10b981' },
      { label: 'Walk', value: activitySummary.walk.count, color: '#f59e0b' },
      { label: 'Run', value: activitySummary.run.count, color: '#ef4444' },
    ];

    res.json({
      success: true,
      data: {
        events: {
          totalAttended: attendedEvents.length,
          events: attendedEvents,
          freeEvents: attendedEvents.filter(e => e.cost === 0 || e.cost === '0').length,
          paidEvents: attendedEvents.filter(e => e.cost > 0 && e.cost !== '0').length,
        },
        classAttendance: {
          userId: classAttendanceData.userId || userId,
          totalDays: classAttendanceData.totalDays,
          attendedDays: classAttendanceData.attendedDays,
          dates: classAttendanceData.dates,
          percentage: parseFloat(classPercentage.toFixed(2)),
          chartData: [
            { label: 'Attended', value: classAttendanceData.attendedDays, color: '#10b981' },
            { label: 'Missed', value: classAttendanceData.totalDays - classAttendanceData.attendedDays, color: '#ef4444' },
          ],
        },
        activities: {
          ...activitySummary,
          chartData: activityChartData,
        },
      },
    });
  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
