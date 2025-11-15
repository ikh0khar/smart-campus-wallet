# Testing Guide - My Activity API

## Quick Test Commands

### 1. Test All Endpoints (Automated)
```bash
./test-activity-api.sh
```

### 2. Manual Testing

#### Get All Events
```bash
curl http://localhost:3000/api/activities/events
```

#### Get Free Events Only
```bash
curl "http://localhost:3000/api/activities/events?isFree=true"
```

#### Log Event Attendance
```bash
curl -X POST http://localhost:3000/api/activities/events/E001/attend \
  -H "Content-Type: application/json" \
  -d '{"userId":"U001"}'
```

#### Get User's Attended Events
```bash
curl http://localhost:3000/api/activities/events/user/U001
```

#### Log Class Attendance
```bash
curl -X POST http://localhost:3000/api/activities/class-attendance/U001 \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-15"}'
```

#### Set Total Class Days
```bash
curl -X PUT http://localhost:3000/api/activities/class-attendance/U001/total \
  -H "Content-Type: application/json" \
  -d '{"totalDays":30}'
```

#### Log Gym Activity
```bash
curl -X POST http://localhost:3000/api/activities/logs/U001 \
  -H "Content-Type: application/json" \
  -d '{"activityType":"gym"}'
```

#### Log Walk Activity
```bash
curl -X POST http://localhost:3000/api/activities/logs/U001 \
  -H "Content-Type: application/json" \
  -d '{"activityType":"walk"}'
```

#### Get Complete Activity Summary
```bash
curl http://localhost:3000/api/activities/summary/U001
```

## Test Results Summary

✅ **All 11 endpoints tested and working:**
1. ✅ Get all events (20 events found)
2. ✅ Filter free events
3. ✅ Log event attendance
4. ✅ Get user's attended events
5. ✅ Log class attendance
6. ✅ Set total class days
7. ✅ Log gym activity
8. ✅ Log walk activity
9. ✅ Get complete activity summary
10. ✅ Get class attendance stats
11. ✅ Get activity logs

## Sample Test Data

**User IDs to test with:**
- U001, U002, U003, ... U020

**Event IDs to test with:**
- E001, E002, E003, ... E020

**Activity Types:**
- `gym`
- `sports`
- `walk`
- `run`

## Browser Testing

You can also test in your browser:

1. **Get all events:**
   ```
   http://localhost:3000/api/activities/events
   ```

2. **Get activity summary:**
   ```
   http://localhost:3000/api/activities/summary/U001
   ```

3. **Get free events:**
   ```
   http://localhost:3000/api/activities/events?isFree=true
   ```

## Frontend Integration Testing

### Test Event Attendance Flow
```javascript
// 1. Get all events
const events = await fetch('http://localhost:3000/api/activities/events')
  .then(r => r.json());

// 2. User clicks to attend event E001
await fetch('http://localhost:3000/api/activities/events/E001/attend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'U001' })
});

// 3. Get user's attended events
const attended = await fetch('http://localhost:3000/api/activities/events/user/U001')
  .then(r => r.json());
```

### Test Activity Logging Flow
```javascript
// 1. Log gym session
await fetch('http://localhost:3000/api/activities/logs/U001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activityType: 'gym' })
});

// 2. Get activity summary
const summary = await fetch('http://localhost:3000/api/activities/summary/U001')
  .then(r => r.json());
```

## Expected Responses

### Event Response
```json
{
  "success": true,
  "data": {
    "eventId": "E001",
    "name": "Tech and Innovation Mixer",
    "isFree": true,
    "cost": 0
  }
}
```

### Activity Summary Response
```json
{
  "success": true,
  "data": {
    "events": {
      "totalAttended": 1,
      "freeEvents": 1,
      "paidEvents": 0
    },
    "classAttendance": {
      "attendedDays": 1,
      "totalDays": 30,
      "percentage": 3.33
    },
    "activities": {
      "total": 2,
      "gym": { "count": 1 },
      "walk": { "count": 1 }
    }
  }
}
```

## Troubleshooting

**Server not responding?**
```bash
# Check if server is running
lsof -i :3000

# Restart server
npm run dev
```

**CORS errors?**
- CORS is enabled, but make sure server is running on port 3000

**Data resets?**
- Data is stored in-memory, so it resets when server restarts
- This is expected behavior for testing

