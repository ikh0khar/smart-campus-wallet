# Rewards and Incentives API Documentation

## Overview
The Rewards system gives users points for maintaining streaks and completing achievements. Points are automatically awarded when users log activities, attend classes, or attend events.

---

## Point System

### Streak Points
Points are awarded when users reach streak milestones:

| Streak Length | Points Awarded |
|--------------|----------------|
| 3 days       | 10 points      |
| 7 days       | 25 points      |
| 14 days      | 50 points      |
| 30 days      | 100 points     |
| 60 days      | 200 points     |
| 90 days      | 500 points     |

**Streak Types:**
- **Class Attendance** - Consecutive days of class attendance
- **Activities** - Consecutive days of gym/sports/walk/run
- **Events** - Consecutive days of attending events

### Achievement Points
Points for specific achievements:

| Achievement | Points |
|-------------|--------|
| Under Budget | 50 points |
| Academic Event | 20 points |
| Free Event | 10 points |
| Activity Day | 5 points |
| Perfect Class Attendance | 100 points |

---

## API Endpoints

### Get Point Values
```
GET /api/rewards/point-values
```

**Response:**
```json
{
  "success": true,
  "data": {
    "streakPoints": {
      "3": 10,
      "7": 25,
      "14": 50,
      "30": 100,
      "60": 200,
      "90": 500
    },
    "achievementPoints": {
      "UNDER_BUDGET": 50,
      "ACADEMIC_EVENT": 20,
      "FREE_EVENT": 10,
      "ACTIVITY_DAY": 5,
      "PERFECT_CLASS_ATTENDANCE": 100
    }
  }
}
```

---

### Get User Points
```
GET /api/rewards/points/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "U001",
    "totalPoints": 30
  }
}
```

---

### Get User Streaks
```
GET /api/rewards/streaks/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classAttendance": {
      "current": 5,
      "longest": 5,
      "lastDate": "2025-11-15",
      "nextMilestone": {
        "days": 7,
        "points": 25,
        "daysRemaining": 2
      }
    },
    "activities": {
      "current": 3,
      "longest": 3,
      "lastDate": "2025-11-15",
      "nextMilestone": null  // Already reached 3-day milestone
    },
    "events": {
      "current": 1,
      "longest": 1,
      "lastDate": "2025-11-15",
      "nextMilestone": {
        "days": 3,
        "points": 10,
        "daysRemaining": 2
      }
    }
  }
}
```

---

### Update Streak (Manual)
```
POST /api/rewards/streaks/:userId/update
```

**Body:**
```json
{
  "streakType": "activities",  // "classAttendance", "activities", or "events"
  "date": "2025-11-15"          // Optional, defaults to today
}
```

**Note:** Streaks are automatically updated when you:
- Log class attendance
- Log gym/activity
- Attend an event

---

### Get User Achievements
```
GET /api/rewards/achievements/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "U001",
    "count": 3,
    "achievements": [
      "ACADEMIC_EVENT_E005",
      "FREE_EVENT_E001",
      "ACTIVITY_2025-11-15"
    ]
  }
}
```

---

### Get Complete Rewards Summary
```
GET /api/rewards/summary/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPoints": 30,
    "streaks": {
      "classAttendance": {
        "current": 0,
        "longest": 0,
        "nextMilestone": {
          "days": 3,
          "points": 10,
          "daysRemaining": 3
        }
      },
      "activities": {
        "current": 4,
        "longest": 0,
        "nextMilestone": {
          "days": 7,
          "points": 25,
          "daysRemaining": 3
        }
      },
      "events": {
        "current": 1,
        "longest": 0,
        "nextMilestone": {
          "days": 3,
          "points": 10,
          "daysRemaining": 2
        }
      }
    },
    "achievements": {
      "count": 1,
      "list": ["ACADEMIC_EVENT_E005"]
    },
    "chartData": [
      { "label": "Class Attendance", "value": 0, "color": "#3b82f6" },
      { "label": "Activities", "value": 4, "color": "#10b981" },
      { "label": "Events", "value": 1, "color": "#f59e0b" }
    ]
  }
}
```

**Use case:** Perfect for the rewards dashboard - gets everything in one call!

---

## Automatic Rewards Integration

Rewards are automatically calculated when you use these endpoints:

### Logging Class Attendance
When you log class attendance, the streak is automatically updated:
```javascript
POST /api/activities/class-attendance/:userId
// Response includes rewards data:
{
  "rewards": {
    "streakUpdated": true,    // true if milestone reached
    "streakLength": 3,
    "pointsEarned": 10,        // Points from streak milestone
    "totalPoints": 10
  }
}
```

### Logging Activities
When you log gym/sports/walk/run, streaks and points are awarded:
```javascript
POST /api/activities/logs/:userId
// Response includes rewards data:
{
  "rewards": {
    "streakUpdated": false,
    "streakLength": 2,
    "pointsEarned": 5,         // 5 points for daily activity
    "totalPoints": 15
  }
}
```

### Attending Events
When you attend events, points are awarded:
```javascript
POST /api/activities/events/:eventId/attend
// Response includes rewards data:
{
  "rewards": {
    "streakUpdated": false,
    "streakLength": 1,
    "pointsEarned": 20,        // 20 for academic event, 10 for free event
    "totalPoints": 35
  }
}
```

---

## Frontend Integration Examples

### Display Rewards Dashboard
```javascript
async function getRewardsDashboard(userId) {
  const response = await fetch(`http://localhost:3000/api/rewards/summary/${userId}`);
  const data = await response.json();
  
  if (data.success) {
    // Display total points
    console.log(`Total Points: ${data.data.totalPoints}`);
    
    // Display streaks
    console.log(`Activity Streak: ${data.data.streaks.activities.current} days`);
    
    // Show next milestone
    const nextMilestone = data.data.streaks.activities.nextMilestone;
    if (nextMilestone) {
      console.log(`Next milestone: ${nextMilestone.daysRemaining} days until ${nextMilestone.points} points!`);
    }
  }
}
```

### Show Points After Activity
```javascript
async function logGymActivity(userId) {
  const response = await fetch(`http://localhost:3000/api/activities/logs/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityType: 'gym' })
  });
  
  const data = await response.json();
  
  if (data.success && data.data.rewards) {
    const rewards = data.data.rewards;
    
    if (rewards.milestoneReached) {
      alert(`🎉 ${rewards.streakLength}-day streak! You earned ${rewards.pointsEarned} points!`);
    } else {
      console.log(`+${rewards.pointsEarned} points! Total: ${rewards.totalPoints}`);
    }
  }
}
```

---

## How Streaks Work

1. **First Day:** Streak starts at 1
2. **Consecutive Days:** Streak increments each day
3. **Missed Day:** Streak resets to 1
4. **Milestone Reached:** Points are awarded when reaching 3, 7, 14, 30, 60, or 90 days

**Example:**
- Day 1: Log gym → Streak: 1 day, 0 points
- Day 2: Log gym → Streak: 2 days, 0 points
- Day 3: Log gym → Streak: 3 days, **10 points awarded!**
- Day 4: Log gym → Streak: 4 days, 0 points
- Day 5: Miss gym → Streak resets
- Day 6: Log gym → Streak: 1 day, 0 points

---

## Notes

- Points accumulate and never decrease
- Streaks reset if you miss a day
- Achievements can only be earned once
- All data is stored in-memory (resets when server restarts)
- In production, this would be stored in a database

---

## Testing

Test the rewards system:

```bash
# Get point values
curl http://localhost:3000/api/rewards/point-values

# Get rewards summary
curl http://localhost:3000/api/rewards/summary/U001

# Log activities for 3 days to trigger streak
curl -X POST http://localhost:3000/api/activities/logs/U001 \
  -H "Content-Type: application/json" \
  -d '{"activityType":"gym","date":"2025-11-15"}'
curl -X POST http://localhost:3000/api/activities/logs/U001 \
  -H "Content-Type: application/json" \
  -d '{"activityType":"gym","date":"2025-11-16"}'
curl -X POST http://localhost:3000/api/activities/logs/U001 \
  -H "Content-Type: application/json" \
  -d '{"activityType":"gym","date":"2025-11-17"}'

# Check rewards - should show 3-day streak and 10 points!
curl http://localhost:3000/api/rewards/summary/U001
```

