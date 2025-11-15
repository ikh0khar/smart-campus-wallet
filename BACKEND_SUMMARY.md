# Backend Summary - What We Built

## Overview
A RESTful API backend for the Smart Campus Wallet application that handles **Spending Dashboard + Budgeting** functionality. The backend serves data from CSV sample files and provides chart-friendly responses for the frontend.

---

## 🎯 Main Purpose
The backend powers the **"Spending Dashboard + Budgeting"** clickable feature that your teammates are building in the frontend. It provides all the data needed to:
- Display spending transactions
- Show category breakdowns (for bar charts)
- Calculate spending summaries and trends
- Track budget progress
- Generate budget alerts

---

## 📊 Data Management

### Sample Data Integration
- **40 transactions** loaded from `wallet_transactions_sample.csv`
- **20 users** loaded from `users_sample.csv`  
- **20 campus events** loaded from `campus_events_sample.csv`
- Data is automatically parsed and cached when server starts
- Categories are normalized (Dining → food, Transport → transportation, etc.)

### Data Structure
- **Transactions**: amount, category, date, description, location, payment method, user ID
- **Budgets**: name, category, amount, period (daily/weekly/monthly/semester), dates
- **Users**: user ID, name, major, class year, residence type, interests

---

## 🔌 API Endpoints

### 1. Transactions Endpoints

#### `GET /api/transactions`
**What it does:** Returns all transactions with filtering options

**Query Parameters:**
- `userId` - Filter by specific user (e.g., U001)
- `category` - Filter by category (food, books, transportation, etc.)
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `minAmount` / `maxAmount` - Filter by amount range
- `sortBy` - Sort field (date, amount, etc.)
- `sortOrder` - asc or desc

**Example Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 1,
      "transactionId": "T0001",
      "userId": "U001",
      "amount": 5.75,
      "category": "food",
      "description": "Starbucks",
      "location": "Campus Center",
      "date": "2025-10-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/transactions/summary`
**What it does:** Calculates spending totals, averages, and period-based summaries

**Returns:**
- Total spent
- Transaction count
- Average per transaction
- Daily/weekly/monthly averages
- Period information

**Use case:** Display summary cards showing total spending, averages, etc.

#### `GET /api/transactions/categories`
**What it does:** Groups spending by category - **PERFECT FOR BAR CHARTS**

**Returns:**
- Array of categories with amounts
- Count of transactions per category
- Percentage of total spending
- Total spending amount

**Example Response:**
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

**Use case:** Frontend can directly use this data for bar charts, pie charts, etc.

#### `GET /api/transactions/trends`
**What it does:** Returns spending trends over time - **PERFECT FOR LINE CHARTS**

**Query Parameters:**
- `period` - daily, weekly, or monthly
- `userId`, `startDate`, `endDate` - filtering options

**Returns:**
- Array of date points with amounts
- Perfect for time-series line charts

**Use case:** Show spending trends over days/weeks/months

---

### 2. Budget Endpoints

#### `GET /api/budgets`
**What it does:** Returns all budgets with calculated progress

**Query Parameters:**
- `isActive` - Filter active/inactive budgets (true/false)

**Returns:**
- List of budgets with:
  - Budget details (name, category, amount, period)
  - Spent amount (calculated from transactions)
  - Remaining amount
  - Percentage used
  - Status (good/warning/exceeded)

**Use case:** Display list of budgets with progress indicators

#### `GET /api/budgets/:id`
**What it does:** Get details of a specific budget

**Returns:** Single budget with all progress information

#### `GET /api/budgets/:id/progress`
**What it does:** Get detailed progress data - **PERFECT FOR PROGRESS BARS/CHARTS**

**Returns:**
- Budget information
- Progress metrics (spent, remaining, percentage, status)
- **chartData** array ready for visualization

**Example Response:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": 1,
      "name": "Monthly Food Budget",
      "category": "food",
      "amount": 200.00
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

**Use case:** Progress bars, donut charts, etc.

#### `GET /api/budgets/alerts`
**What it does:** Returns budgets that need attention (close to or over limit)

**Query Parameters:**
- `threshold` - Percentage threshold (default: 80%)

**Returns:** List of budgets that are at or above the threshold

**Use case:** Show warning notifications for budgets approaching limits

#### `POST /api/budgets`
**What it does:** Create a new budget (currently mock - not persisted)

**Body:**
```json
{
  "name": "Monthly Food Budget",
  "category": "food",
  "amount": 200.00,
  "period": "monthly",
  "startDate": "2025-11-01",
  "endDate": "2025-11-30"
}
```

---

## 🎨 Chart-Friendly Data Format

All endpoints return data in formats optimized for frontend charting libraries:

- **Category breakdown** → Ready for bar charts, pie charts
- **Trends** → Ready for line charts
- **Budget progress** → Ready for progress bars, donut charts
- **All data includes** → Labels, values, colors, percentages

---

## 🔧 Technical Features

### CORS Enabled
- Allows requests from any frontend origin
- No CORS errors when connecting from frontend

### Data Filtering
- Filter by user, category, date range, amount
- Sort by any field
- Supports multiple filters simultaneously

### Category Normalization
- Automatically converts CSV categories to API format:
  - Dining → food
  - Transport → transportation
  - Supplies → other
  - Pharmacy → utilities

### Date Handling
- Parses CSV dates (YYYY-MM-DD format)
- Returns ISO 8601 dates
- Supports date range filtering

### Error Handling
- All endpoints return consistent error format
- Try-catch blocks prevent crashes
- Helpful error messages

---

## 📁 Project Structure

```
smart-campus-wallet/
├── server.js                 # Main server file
├── routes/
│   ├── transactions.js       # All transaction endpoints
│   └── budgets.js            # All budget endpoints
├── data/
│   ├── loadSampleData.js     # CSV data loader
│   ├── wallet_transactions_sample.csv
│   ├── users_sample.csv
│   └── campus_events_sample.csv
├── utils/
│   └── csvParser.js          # CSV parsing utility
└── api-examples.js           # Frontend integration examples
```

---

## 🚀 What It Powers in the Frontend

When your teammates build the **"Spending Dashboard + Budgeting"** page, this backend provides:

1. **Transaction List** - All spending transactions with filters
2. **Category Charts** - Bar/pie charts showing spending by category
3. **Spending Summary** - Total spent, averages, trends
4. **Budget Tracking** - Progress bars showing budget vs. spent
5. **Budget Alerts** - Warnings when approaching budget limits
6. **Time-based Views** - Daily/weekly/monthly spending trends

---

## ✅ What's Working

- ✅ All transaction endpoints
- ✅ All budget endpoints  
- ✅ CSV data loading and parsing
- ✅ Category normalization
- ✅ Date filtering and sorting
- ✅ Chart-friendly data formats
- ✅ CORS enabled for frontend
- ✅ Error handling
- ✅ Health check endpoint

---

## 🔮 What's Next (Not Yet Built)

- ⏳ AI integration (budget recommendations, insights, predictions)
- ⏳ Database persistence (currently using CSV files)
- ⏳ Authentication system
- ⏳ Feature 2: My Activity (using campus events data)
- ⏳ Feature 3: Rewards and Incentives

---

## 🎯 Summary

**The backend is a complete API for the Spending Dashboard + Budgeting feature.** It:
- Loads real sample data from CSV files
- Provides all necessary endpoints for transactions and budgets
- Returns data in chart-friendly formats
- Supports filtering, sorting, and date ranges
- Calculates spending summaries and budget progress
- Is ready to connect to your teammates' frontend

**The server is running on `http://localhost:3000` and ready for frontend integration!**

