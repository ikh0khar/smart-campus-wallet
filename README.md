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

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Environment**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally or MongoDB Atlas account

## Quick Start

### Install Dependencies
```bash
npm install
```

### Set Up MongoDB

**Option A: Local MongoDB (macOS)**
```bash
# Install MongoDB using Homebrew
./scripts/install-mongodb.sh

# Or manually: brew tap mongodb/brew && brew install mongodb-community
# Then start: brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `.env` file with your connection string

### Configure Environment

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/smart-campus-wallet
PORT=3000
NODE_ENV=development
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-campus-wallet
```

### Test MongoDB Connection
```bash
node scripts/test-connection.js
```

### Import Data
```bash
# Import the transaction dataset
node scripts/import-csv.js data/wallet_transactions_sample.csv --clear
```

### Run the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## Database Integration

### MongoDB Connection

The database connection is configured in `config/database.js`. To use it in your application:

```javascript
const connectDB = require('./config/database');

// Connect to MongoDB
await connectDB();
```

### Database Models

#### Transaction Model (`models/Transaction.js`)

Stores all wallet transactions with the following fields:
- `transactionId` - Unique transaction identifier
- `userId` - User ID who made the transaction
- `merchant` - Merchant/store name
- `category` - Transaction category (Dining, Books, Supplies, etc.)
- `amount` - Transaction amount
- `paymentMethod` - Payment method used
- `location` - Transaction location
- `date` - Transaction date
- `createdAt` - Record creation timestamp

#### User Model (`models/User.js`)

Stores user information:
- `userId` - Unique user identifier
- `email` - User email (optional)
- `name` - User name (optional)
- `balance` - Current wallet balance
- `createdAt` - Account creation date
- `updatedAt` - Last update timestamp

#### Budget Model (`models/Budget.js`)

Stores user budgets:
- `userId` - User identifier
- `name` - Budget name
- `category` - Budget category
- `amount` - Budget limit
- `period` - Budget period (daily, weekly, monthly, semester)
- `startDate` - Budget start date
- `endDate` - Budget end date
- `isActive` - Whether budget is active

#### Event Model (`models/Event.js`)

Stores campus events:
- `eventId` - Unique event identifier
- `name` - Event name
- `category` - Event category
- `location` - Event location
- `startTime` - Event start time
- `tags` - Event tags
- `cost` - Event cost

#### EventAttendance Model (`models/EventAttendance.js`)

Tracks user event attendance:
- `userId` - User identifier
- `eventId` - Event identifier
- `attendedAt` - Attendance timestamp

#### ClassAttendance Model (`models/ClassAttendance.js`)

Tracks class attendance:
- `userId` - User identifier
- `totalDays` - Total class days
- `attendedDays` - Days attended
- `dates` - Array of attended dates

#### ActivityLog Model (`models/ActivityLog.js`)

Logs user activities (gym, sports, walk, run):
- `userId` - User identifier
- `activityType` - Type of activity
- `date` - Activity date
- `createdAt` - Log creation timestamp

#### RewardPoints Model (`models/RewardPoints.js`)

Stores user reward points:
- `userId` - User identifier
- `totalPoints` - Total points earned
- `updatedAt` - Last update timestamp

#### Streak Model (`models/Streak.js`)

Tracks user streaks:
- `userId` - User identifier
- `streakType` - Type of streak (classAttendance, activities, events)
- `current` - Current streak length
- `longest` - Longest streak achieved
- `lastDate` - Last activity date

#### Achievement Model (`models/Achievement.js`)

Stores user achievements:
- `userId` - User identifier
- `achievementId` - Achievement identifier
- `pointsEarned` - Points earned for achievement
- `earnedAt` - Achievement earned timestamp

### Using the Models

```javascript
const { User, Transaction } = require('./models');
const connectDB = require('./config/database');

async function example() {
  // Connect to database
  await connectDB();
  
  // Find user
  const user = await User.findOne({ userId: 'U001' });
  
  // Get user transactions
  const transactions = await Transaction.find({ userId: 'U001' })
    .sort({ date: -1 })
    .limit(10);
  
  // Create new transaction
  const newTransaction = new Transaction({
    transactionId: 'T0201',
    userId: 'U001',
    merchant: 'Starbucks',
    category: 'Dining',
    amount: 5.75,
    paymentMethod: 'Dining Dollars',
    location: 'Campus Center',
    date: new Date()
  });
  await newTransaction.save();
}
```

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

## Importing Data

### Import CSV Files

```bash
# Import transactions from CSV
node scripts/import-csv.js data/wallet_transactions_sample.csv

# Clear existing data before importing
node scripts/import-csv.js data/wallet_transactions_sample.csv --clear
```

The import script:
- Parses CSV files with proper date handling (MM/DD/YY format)
- Maps CSV columns to database fields
- Creates/updates user records automatically
- Handles duplicate transactions
- Shows progress and summary

### CSV Format

Expected CSV columns:
- `transaction_id` - Unique transaction ID
- `user_id` - User identifier
- `merchant` - Merchant name
- `category` - Transaction category
- `amount` - Transaction amount
- `payment_method` - Payment method
- `location` - Transaction location
- `date` - Transaction date (MM/DD/YY format)

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

The backend uses MongoDB with real CSV sample data:
- **200 transactions** from `data/wallet_transactions_sample.csv`
- **20 users** automatically created from transaction data
- **3 budgets** seeded via `npm run seed:budgets`
- **20 events** from `data/campus_events_sample.csv` seeded via `npm run seed:events`

### Seeding Data

```bash
# Import transactions
npm run import data/wallet_transactions_sample.csv --clear

# Seed budgets
npm run seed:budgets --clear

# Seed events
npm run seed:events --clear
```

Categories are normalized:
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
2. Backend URL: `http://localhost:5000/api` (or check your PORT in `.env`)
3. CORS is enabled - frontend can connect from any origin
4. See `api-examples.js` for code examples

## Testing

### Test API Endpoints

```bash
# Start server first
npm run dev

# In another terminal, run tests
npm run test:api
```

### Manual Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Get transactions
curl http://localhost:5000/api/transactions

# Get budgets
curl http://localhost:5000/api/budgets

# Get events
curl http://localhost:5000/api/activities/events

# Get rewards summary
curl http://localhost:5000/api/rewards/summary/U001
```

See [TESTING_AND_NEXT_STEPS.md](./TESTING_AND_NEXT_STEPS.md) for complete testing guide.

## Scripts

```bash
# Database Connection & Verification
npm run test:connection    # Test MongoDB connection
npm run verify             # Verify database integration
npm run examples           # Run query examples

# Data Import & Seeding
npm run import             # Import transactions CSV
npm run seed:budgets       # Seed sample budgets
npm run seed:events        # Seed campus events

# Testing
npm run test:api           # Test all API endpoints

# Server
npm run dev                # Start development server (with auto-reload)
npm start                  # Start production server

# MongoDB Management (local)
brew services start mongodb-community    # Start MongoDB
brew services stop mongodb-community     # Stop MongoDB
brew services list | grep mongodb        # Check MongoDB status
```

## Features Completed

✅ **Feature 1: Spending Dashboard + Budgeting**
- Transaction management and filtering
- Category breakdowns (chart-ready)
- Spending summaries and trends
- Budget tracking and progress
- **✅ MongoDB database integration for persistence**

✅ **Feature 2: My Activity**
- Campus event browsing and attendance logging
- Class attendance tracking
- Gym/activity logging (gym, sports, walk, run)
- Activity summaries and statistics
- **✅ MongoDB database integration for persistence**

✅ **Feature 3: Rewards and Incentives**
- Points system for streaks and achievements
- Streak tracking (3 days, week, month milestones)
- Automatic rewards when logging activities
- Points for attending events and staying under budget
- **✅ MongoDB database integration for persistence**

## Database Status

All features are now using MongoDB for persistence:

- ✅ **Transactions**: 200 documents in MongoDB
- ✅ **Budgets**: 3 documents in MongoDB
- ✅ **Users**: 20 documents in MongoDB
- ✅ **Events**: 20 documents in MongoDB
- ✅ **Activities**: EventAttendance, ClassAttendance, ActivityLog models ready
- ✅ **Rewards**: RewardPoints, Streak, Achievement models ready

### Verify Database

```bash
# Check database status
npm run verify

# View all collections
mongosh mongodb://localhost:27017/smart-campus-wallet --eval "db.getCollectionNames()"

# Check document counts
mongosh mongodb://localhost:27017/smart-campus-wallet --eval "
print('Transactions: ' + db.transactions.countDocuments());
print('Budgets: ' + db.budgets.countDocuments());
print('Users: ' + db.users.countDocuments());
print('Events: ' + db.events.countDocuments());
"
```

## Next Steps

- [x] Add database integration (MongoDB) for persistence
- [x] Migrate existing features to use MongoDB (Transactions & Budgets)
- [x] Migrate Feature 2 (My Activity) to MongoDB
- [x] Migrate Feature 3 (Rewards) to MongoDB
- [ ] Add AI integration (budget recommendations, spending insights, predictions)
- [ ] Add authentication
- [ ] Add transaction CRUD operations (POST, PUT, DELETE)
- [ ] Add user profile management

## License

ISC
