# Smart Campus Wallet - Backend API

Backend API for the Smart Campus Wallet application built for HackFest 2025 @ Rutgers Newark.

## Features

### Feature 1: Spending Dashboard + Budgeting (Current)
- **Transactions API** - View and filter transactions
- **Spending Summary** - Get totals, averages, and period-based summaries
- **Category Breakdown** - Get spending by category (perfect for bar charts)
- **Spending Trends** - Get time-based spending data (daily/weekly/monthly)
- **Budget Management** - Create, view, and track budgets
- **Budget Progress** - Get detailed budget progress with chart-friendly data
- **Budget Alerts** - Get budgets that need attention

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Transactions
```
GET /api/transactions
GET /api/transactions/summary?startDate=2025-11-01&endDate=2025-11-30
GET /api/transactions/categories?startDate=2025-11-01&endDate=2025-11-30
GET /api/transactions/trends?period=daily&startDate=2025-11-01&endDate=2025-11-30
```

### Budgets
```
GET /api/budgets
GET /api/budgets/:id
GET /api/budgets/:id/progress
GET /api/budgets/alerts?threshold=80
POST /api/budgets
```

### Activities (Feature 2: My Activity)
```
GET /api/activities/events
GET /api/activities/events/:eventId
GET /api/activities/events/user/:userId
POST /api/activities/events/:eventId/attend
DELETE /api/activities/events/:eventId/attend
GET /api/activities/class-attendance/:userId
POST /api/activities/class-attendance/:userId
PUT /api/activities/class-attendance/:userId/total
GET /api/activities/logs/:userId
POST /api/activities/logs/:userId
GET /api/activities/summary/:userId
```

**📖 See [ACTIVITY_API_DOCS.md](./ACTIVITY_API_DOCS.md) for complete My Activity API documentation**

### Rewards (Feature 3: Rewards and Incentives)
```
GET /api/rewards/point-values
GET /api/rewards/points/:userId
GET /api/rewards/streaks/:userId
POST /api/rewards/streaks/:userId/update
GET /api/rewards/achievements/:userId
GET /api/rewards/summary/:userId
```

**📖 See [REWARDS_API_DOCS.md](./REWARDS_API_DOCS.md) for complete Rewards API documentation**

## Response Formats

All endpoints return data in chart-friendly formats:

### Category Breakdown Example
```json
{
  "success": true,
  "data": [
    {
      "category": "food",
      "amount": 53.00,
      "count": 5,
      "percentage": 15.23
    },
    {
      "category": "books",
      "amount": 165.99,
      "count": 2,
      "percentage": 47.70
    }
  ],
  "total": 348.00
}
```

### Budget Progress Example
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": 1,
      "name": "Monthly Food Budget",
      "category": "food",
      "amount": 200.00,
      "period": "monthly"
    },
    "progress": {
      "spent": 53.00,
      "remaining": 147.00,
      "percentage": 26.50,
      "status": "good"
    },
    "chartData": [
      { "label": "Spent", "value": 53.00, "color": "#10b981" },
      { "label": "Remaining", "value": 147.00, "color": "#e5e7eb" }
    ]
  }
}
```

## Sample Data

The backend now uses real CSV sample data:
- **40 transactions** from `data/wallet_transactions_sample.csv`
- **20 users** from `data/users_sample.csv`
- **20 campus events** from `data/campus_events_sample.csv`

Data is automatically loaded when the server starts. Categories are normalized:
- `Dining` → `food`
- `Transport` → `transportation`
- `Supplies` → `other`
- `Pharmacy` → `utilities`

## Testing with Sample Data

You can filter by `userId` to see data for specific users:
```
GET /api/transactions?userId=U001
GET /api/transactions/categories?userId=U001
GET /api/transactions/summary?userId=U001&startDate=2025-10-01&endDate=2025-10-31
```

## Frontend Integration

**📖 See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for complete integration guide**

Quick start:
1. Make sure backend is running: `npm run dev`
2. Backend URL: `http://localhost:3000/api`
3. CORS is enabled - frontend can connect from any origin
4. See `api-examples.js` for code examples

## Features Completed

✅ **Feature 1: Spending Dashboard + Budgeting**
- Transaction management and filtering
- Category breakdowns (chart-ready)
- Spending summaries and trends
- Budget tracking and progress

✅ **Feature 2: My Activity**
- Campus event browsing and attendance logging
- Class attendance tracking
- Gym/activity logging (gym, sports, walk, run)
- Activity summaries and statistics

✅ **Feature 3: Rewards and Incentives**
- Points system for streaks and achievements
- Streak tracking (3 days, week, month milestones)
- Automatic rewards when logging activities
- Points for attending events and staying under budget

## Next Steps

- [ ] Add AI integration (budget recommendations, spending insights, predictions)
- [ ] Add database integration (MongoDB) for persistence
- [ ] Add authentication
- [ ] Add Feature 3: Rewards and Incentives
