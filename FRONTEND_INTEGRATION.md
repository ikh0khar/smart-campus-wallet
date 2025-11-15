# Frontend Integration Guide

This guide will help your teammates connect their frontend to this backend API.

## Backend Server Details

- **Base URL**: `http://localhost:3000`
- **API Prefix**: `/api`
- **CORS**: Enabled (allows requests from any origin)

## Quick Setup

### 1. Make sure the backend is running

```bash
# In the backend directory
npm run dev
```

The server should be running on `http://localhost:3000`

### 2. Test the connection

Open in browser or use curl:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Smart Campus Wallet API is running"
}
```

## API Configuration for Frontend

### Option 1: Create an API config file (Recommended)

Create a file in your frontend project (e.g., `src/config/api.js` or `src/utils/api.js`):

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Export base URL for direct use
export default API_BASE_URL;
```

### Option 2: Use environment variables

Create a `.env` file in your frontend project:

```env
REACT_APP_API_URL=http://localhost:3000/api
# or for Vite:
VITE_API_URL=http://localhost:3000/api
```

Then use it:
```javascript
const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

## Example API Calls

### Using Fetch API

```javascript
// Get all transactions for a user
const getTransactions = async (userId) => {
  const response = await fetch(`http://localhost:3000/api/transactions?userId=${userId}`);
  const data = await response.json();
  return data;
};

// Get category breakdown (for charts)
const getCategoryBreakdown = async (userId) => {
  const response = await fetch(`http://localhost:3000/api/transactions/categories?userId=${userId}`);
  const data = await response.json();
  return data;
};

// Get spending summary
const getSpendingSummary = async (userId, startDate, endDate) => {
  const url = `http://localhost:3000/api/transactions/summary?userId=${userId}&startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
};

// Get budgets
const getBudgets = async () => {
  const response = await fetch('http://localhost:3000/api/budgets');
  const data = await response.json();
  return data;
};
```

### Using Axios (if your frontend uses it)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get transactions
const getTransactions = (userId) => {
  return api.get('/transactions', { params: { userId } });
};

// Get category breakdown
const getCategoryBreakdown = (userId) => {
  return api.get('/transactions/categories', { params: { userId } });
};
```

## Available API Endpoints

### Transactions

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/transactions` | Get all transactions | `userId`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount` |
| GET | `/api/transactions/summary` | Get spending summary | `userId`, `startDate`, `endDate` |
| GET | `/api/transactions/categories` | Get category breakdown (for charts) | `userId`, `startDate`, `endDate` |
| GET | `/api/transactions/trends` | Get spending trends over time | `userId`, `period` (daily/weekly/monthly), `startDate`, `endDate` |

### Budgets

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/budgets` | Get all budgets | `isActive` (true/false) |
| GET | `/api/budgets/:id` | Get single budget | - |
| GET | `/api/budgets/:id/progress` | Get budget progress (for charts) | - |
| GET | `/api/budgets/alerts` | Get budgets needing attention | `threshold` (default: 80) |
| POST | `/api/budgets` | Create new budget | Body: `{ name, category, amount, period, startDate, endDate }` |

## Response Formats

### Transactions Response
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": 1,
      "transactionId": "T0001",
      "userId": "U001",
      "type": "purchase",
      "amount": 5.75,
      "category": "food",
      "description": "Starbucks",
      "location": "Campus Center",
      "paymentMethod": "Dining Dollars",
      "date": "2025-10-01T00:00:00.000Z"
    }
  ]
}
```

### Category Breakdown (Perfect for Bar Charts)
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

### Budget Progress (Perfect for Progress Charts)
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

## Sample Users for Testing

Use these user IDs from the sample data:
- `U001` - Alex Rivera (Computer Science)
- `U002` - Maya Patel (Finance)
- `U003` - Jordan Lee (Engineering)
- ... (U001 through U020)

## Common Issues & Solutions

### CORS Errors
- ✅ CORS is already enabled on the backend
- If you still get CORS errors, make sure the backend is running on port 3000

### Connection Refused
- Make sure the backend server is running: `npm run dev`
- Check that it's running on port 3000 (not 5000)

### Data Not Loading
- Check the browser console for errors
- Verify the API endpoint URL is correct
- Make sure you're using the correct `userId` parameter

## Testing in Browser Console

You can test the API directly in your browser console:

```javascript
// Test health check
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Test transactions
fetch('http://localhost:3000/api/transactions?userId=U001')
  .then(res => res.json())
  .then(data => console.log(data));

// Test category breakdown
fetch('http://localhost:3000/api/transactions/categories?userId=U001')
  .then(res => res.json())
  .then(data => console.log(data));
```

## Next Steps

1. Share this guide with your frontend teammates
2. Make sure the backend is running when they test
3. They can start by testing the health endpoint
4. Then integrate one endpoint at a time (start with transactions)
5. Use the category breakdown endpoint for charts/graphs

