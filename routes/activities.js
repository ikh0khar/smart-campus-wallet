const express = require('express');
const router = express.Router();
const { getEvents, getUsers } = require('../data/loadSampleData');
const {
  getUserAttendedEvents,
  logEventAttendance,
  removeEventAttendance,
  getClassAttendance,
  logClassAttendance,
  setTotalClassDays,
  getActivityLogs,
  logActivity,
  getActivitySummary,
} = require('../data/activityData');
const { updateStreak, awardEventPoints } = require('../data/rewardsData');

// ============================================
// EVENTS ENDPOINTS
// ============================================

// @route   GET /api/activities/events
// @desc    Get all campus events
// @access  Public
router.get('/events', (req, res) => {
  try {
    const { category, isFree, userId } = req.query;
    let events = getEvents();

    // Filter by category
    if (category) {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by free/paid
    if (isFree !== undefined) {
      const freeFilter = isFree === 'true';
      events = events.filter(e => (e.cost === 0 || e.cost === '0') === freeFilter);
    }

    // Add attendance status if userId provided
    if (userId) {
      const attendedEvents = getUserAttendedEvents(userId);
      events = events.map(event => ({
        ...event,
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
router.get('/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query;
    const events = getEvents();
    const event = events.find(e => e.eventId === eventId);

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
      const attendedEvents = getUserAttendedEvents(userId);
      eventData.isAttending = attendedEvents.includes(eventId);
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
router.get('/events/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const attendedEventIds = getUserAttendedEvents(userId);
    const allEvents = getEvents();

    const attendedEvents = attendedEventIds
      .map(eventId => allEvents.find(e => e.eventId === eventId))
      .filter(e => e !== undefined)
      .map(event => ({
        ...event,
        isFree: event.cost === 0 || event.cost === '0',
        isAttending: true,
      }));

    res.json({
      success: true,
      count: attendedEvents.length,
      data: attendedEvents,
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
router.post('/events/:eventId/attend', (req, res) => {
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
    const events = getEvents();
    const event = events.find(e => e.eventId === eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const attendedEvents = logEventAttendance(userId, eventId);

    // Update event streak and award points
    const streakResult = updateStreak(userId, 'events', new Date().toISOString().split('T')[0]);
    let eventPoints = null;
    if (event) {
      eventPoints = awardEventPoints(userId, event);
    }

    res.json({
      success: true,
      message: 'Event attendance logged',
      data: {
        eventId,
        userId,
        attendedEvents,
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
router.delete('/events/:eventId/attend', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const attendedEvents = removeEventAttendance(userId, eventId);

    res.json({
      success: true,
      message: 'Event attendance removed',
      data: {
        eventId,
        userId,
        attendedEvents,
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
router.get('/class-attendance/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const attendance = getClassAttendance(userId);

    // Calculate attendance percentage
    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    res.json({
      success: true,
      data: {
        ...attendance,
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
router.post('/class-attendance/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.body;

    const attendance = logClassAttendance(userId, date);
    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    // Update class attendance streak
    const streakResult = updateStreak(userId, 'classAttendance', date);

    res.json({
      success: true,
      message: 'Class attendance logged',
      data: {
        ...attendance,
        percentage: parseFloat(percentage.toFixed(2)),
        rewards: {
          streakUpdated: streakResult.milestone,
          streakLength: streakResult.streakLength,
          pointsEarned: streakResult.pointsEarned,
          totalPoints: streakResult.totalPoints,
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
router.put('/class-attendance/:userId/total', (req, res) => {
  try {
    const { userId } = req.params;
    const { totalDays } = req.body;

    if (totalDays === undefined || totalDays < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalDays must be a positive number',
      });
    }

    const attendance = setTotalClassDays(userId, totalDays);
    const percentage = attendance.totalDays > 0
      ? (attendance.attendedDays / attendance.totalDays) * 100
      : 0;

    res.json({
      success: true,
      message: 'Total class days updated',
      data: {
        ...attendance,
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
router.get('/logs/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const logs = getActivityLogs(userId);
    const summary = getActivitySummary(userId);

    res.json({
      success: true,
      data: {
        logs,
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
router.post('/logs/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { activityType, date } = req.body;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        message: 'activityType is required (gym, sports, walk, or run)',
      });
    }

    const logs = logActivity(userId, activityType, date);
    const summary = getActivitySummary(userId);

    // Update activity streak and award points
    const dateStr = date || new Date().toISOString().split('T')[0];
    const streakResult = updateStreak(userId, 'activities', dateStr);
    const activityPoints = awardActivityPoints(userId, dateStr);

    res.json({
      success: true,
      message: `${activityType} activity logged`,
      data: {
        activityType,
        logs,
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
    if (error.message.includes('Invalid activity type')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/activities/summary/:userId
// @desc    Get complete activity summary for dashboard
// @access  Public
router.get('/summary/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Get all data
    const attendedEventIds = getUserAttendedEvents(userId);
    const allEvents = getEvents();
    const attendedEvents = attendedEventIds
      .map(id => allEvents.find(e => e.eventId === id))
      .filter(e => e !== undefined);

    const classAttendance = getClassAttendance(userId);
    const activitySummary = getActivitySummary(userId);

    // Calculate class attendance percentage
    const classPercentage = classAttendance.totalDays > 0
      ? (classAttendance.attendedDays / classAttendance.totalDays) * 100
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
          ...classAttendance,
          percentage: parseFloat(classPercentage.toFixed(2)),
          chartData: [
            { label: 'Attended', value: classAttendance.attendedDays, color: '#10b981' },
            { label: 'Missed', value: classAttendance.totalDays - classAttendance.attendedDays, color: '#ef4444' },
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

