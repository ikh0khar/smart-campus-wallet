# My Activity API Documentation

## Overview
The My Activity feature allows users to:
- Browse and log campus event attendance
- Track class attendance
- Log gym and physical activities (gym, sports, walk, run)
- View activity summaries and statistics

---

## Events Endpoints

### Get All Events
```
GET /api/activities/events
```

**Query Parameters:**
- `category` - Filter by event category (Tech, Career, Finance, etc.)
- `isFree` - Filter free events (true/false)
- `userId` - Include attendance status for user

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "eventId": "E001",
      "name": "Tech and Innovation Mixer",
      "category": "Tech",
      "location": "Business School Atrium",
      "startTime": "2025-11-05 17:00",
      "tags": ["tech", "networking"],
      "cost": 0,
      "isFree": true,
      "isAttending": false  // Only if userId provided
    }
  ]
}
```

**Example:**
```javascript
// Get all free events
fetch('http://localhost:3000/api/activities/events?isFree=true')

// Get events for specific user (shows attendance status)
fetch('http://localhost:3000/api/activities/events?userId=U001')
```

---

### Get Single Event
```
GET /api/activities/events/:eventId
```

**Query Parameters:**
- `userId` - Include attendance status

**Example:**
```javascript
fetch('http://localhost:3000/api/activities/events/E001?userId=U001')
```

---

### Get User's Attended Events
```
GET /api/activities/events/user/:userId
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "eventId": "E001",
      "name": "Tech and Innovation Mixer",
      "category": "Tech",
      "location": "Business School Atrium",
      "startTime": "2025-11-05 17:00",
      "tags": ["tech", "networking"],
      "cost": 0,
      "isFree": true,
      "isAttending": true
    }
  ]
}
```

---

### Log Event Attendance
```
POST /api/activities/events/:eventId/attend
```

**Body:**
```json
{
  "userId": "U001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event attendance logged",
  "data": {
    "eventId": "E001",
    "userId": "U001",
    "attendedEvents": ["E001"]
  }
}
```

**Example:**
```javascript
fetch('http://localhost:3000/api/activities/events/E001/attend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'U001' })
})
```

---

### Remove Event Attendance
```
DELETE /api/activities/events/:eventId/attend
```

**Body:**
```json
{
  "userId": "U001"
}
```

---

## Class Attendance Endpoints

### Get Class Attendance Stats
```
GET /api/activities/class-attendance/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDays": 30,
    "attendedDays": 25,
    "dates": ["2025-11-01", "2025-11-02", ...],
    "percentage": 83.33,
    "chartData": [
      { "label": "Attended", "value": 25, "color": "#10b981" },
      { "label": "Missed", "value": 5, "color": "#ef4444" }
    ]
  }
}
```

---

### Log Class Attendance
```
POST /api/activities/class-attendance/:userId
```

**Body:**
```json
{
  "date": "2025-11-15"  // Optional, defaults to today
}
```

**Example:**
```javascript
fetch('http://localhost:3000/api/activities/class-attendance/U001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date: '2025-11-15' })
})
```

---

### Set Total Class Days
```
PUT /api/activities/class-attendance/:userId/total
```

**Body:**
```json
{
  "totalDays": 30
}
```

**Use case:** Set the total number of class days in the semester/period

---

## Activity/Gym Logging Endpoints

### Get Activity Logs
```
GET /api/activities/logs/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": {
      "gym": ["2025-11-15", "2025-11-14"],
      "sports": ["2025-11-10"],
      "walk": ["2025-11-12"],
      "run": []
    },
    "summary": {
      "gym": { "count": 2, "dates": [...] },
      "sports": { "count": 1, "dates": [...] },
      "walk": { "count": 1, "dates": [...] },
      "run": { "count": 0, "dates": [] },
      "total": 4
    }
  }
}
```

---

### Log Activity
```
POST /api/activities/logs/:userId
```

**Body:**
```json
{
  "activityType": "gym",  // "gym", "sports", "walk", or "run"
  "date": "2025-11-15"     // Optional, defaults to today
}
```

**Response:**
```json
{
  "success": true,
  "message": "gym activity logged",
  "data": {
    "activityType": "gym",
    "logs": {
      "gym": ["2025-11-15"],
      "sports": [],
      "walk": [],
      "run": []
    },
    "summary": {
      "gym": { "count": 1, "dates": ["2025-11-15"] },
      "sports": { "count": 0, "dates": [] },
      "walk": { "count": 0, "dates": [] },
      "run": { "count": 0, "dates": [] },
      "total": 1
    }
  }
}
```

**Example:**
```javascript
// Log gym session
fetch('http://localhost:3000/api/activities/logs/U001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activityType: 'gym' })
})

// Log walk
fetch('http://localhost:3000/api/activities/logs/U001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activityType: 'walk', date: '2025-11-15' })
})
```

**Valid activity types:**
- `gym` - Gym workout
- `sports` - Sports activity
- `walk` - Walking
- `run` - Running

---

## Activity Summary Endpoint

### Get Complete Activity Summary
```
GET /api/activities/summary/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": {
      "totalAttended": 2,
      "events": [...],
      "freeEvents": 1,
      "paidEvents": 1
    },
    "classAttendance": {
      "totalDays": 30,
      "attendedDays": 25,
      "dates": [...],
      "percentage": 83.33,
      "chartData": [
        { "label": "Attended", "value": 25, "color": "#10b981" },
        { "label": "Missed", "value": 5, "color": "#ef4444" }
      ]
    },
    "activities": {
      "gym": { "count": 5, "dates": [...] },
      "sports": { "count": 2, "dates": [...] },
      "walk": { "count": 8, "dates": [...] },
      "run": { "count": 3, "dates": [...] },
      "total": 18,
      "chartData": [
        { "label": "Gym", "value": 5, "color": "#3b82f6" },
        { "label": "Sports", "value": 2, "color": "#10b981" },
        { "label": "Walk", "value": 8, "color": "#f59e0b" },
        { "label": "Run", "value": 3, "color": "#ef4444" }
      ]
    }
  }
}
```

**Use case:** Perfect for the main activity dashboard page - gets everything in one call!

---

## Frontend Integration Examples

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

function useActivitySummary(userId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/api/activities/summary/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.data);
        }
        setLoading(false);
      });
  }, [userId]);

  return { summary, loading };
}
```

### Log Event Attendance
```javascript
async function attendEvent(eventId, userId) {
  const response = await fetch(
    `http://localhost:3000/api/activities/events/${eventId}/attend`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }
  );
  return response.json();
}
```

### Log Activity
```javascript
async function logActivity(userId, activityType) {
  const response = await fetch(
    `http://localhost:3000/api/activities/logs/${userId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType })
    }
  );
  return response.json();
}
```

---

## Chart Data Formats

All endpoints return data in chart-friendly formats:

### Events
- Shows `isFree` flag for each event
- Can filter by free/paid events
- Shows attendance status

### Class Attendance
- `chartData` array ready for pie/donut charts
- Percentage calculated automatically

### Activities
- `chartData` array ready for bar charts
- Separate counts for each activity type
- Total activity count

---

## Notes

- All data is stored in-memory (resets when server restarts)
- In production, this would be stored in a database
- Date format: YYYY-MM-DD (e.g., "2025-11-15")
- User IDs from sample data: U001 through U020
- Event IDs from sample data: E001 through E020

