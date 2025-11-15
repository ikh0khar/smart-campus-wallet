# smart-campus-wallet

A smart wallet application for campus students with budget tracking, spending insights, and rewards.

## Features

- 💰 Transaction Management
- 📊 Spending Analytics & Insights
- 🎁 Rewards and Incentives (Coming Soon)
- 💳 Transaction History Tracking
- 📱 Budget Management (Coming Soon)

## Tech Stack

- **Backend**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Environment**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally or MongoDB Atlas account

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

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

### 3. Configure Environment

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

### 4. Test Connection

```bash
node scripts/test-connection.js
```

### 5. Import Data

```bash
# Import the transaction dataset
node scripts/import-csv.js data/wallet_transactions_sample.csv --clear
```

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

## Project Structure

```
smart-campus-wallet/
├── config/
│   └── database.js          # MongoDB connection configuration
├── models/
│   ├── User.js              # User model
│   ├── Transaction.js       # Transaction model
│   └── index.js             # Model exports
├── scripts/
│   ├── import-csv.js        # CSV data importer
│   ├── test-connection.js   # Database connection tester
│   ├── install-mongodb.sh   # MongoDB installation script
│   └── manual-install-guide.md
├── data/
│   └── wallet_transactions_sample.csv  # Sample dataset
├── .env                     # Environment variables (create this)
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
└── README.md               # This file
```

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

## Database Queries Examples

### Get all transactions for a user
```javascript
const transactions = await Transaction.find({ userId: 'U001' });
```

### Get transactions by category
```javascript
const diningTransactions = await Transaction.find({ category: 'Dining' });
```

### Get transactions in date range
```javascript
const startDate = new Date('2025-10-01');
const endDate = new Date('2025-10-31');
const transactions = await Transaction.find({
  date: { $gte: startDate, $lte: endDate }
});
```

### Get user spending summary
```javascript
const totalSpent = await Transaction.aggregate([
  { $match: { userId: 'U001' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
]);
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart-campus-wallet` |
| `PORT` | Server port (optional) | `3000` |
| `NODE_ENV` | Environment (optional) | `development` |

## Scripts

```bash
# Test MongoDB connection
npm run test:connection
node scripts/test-connection.js

# Import data
npm run import data/wallet_transactions_sample.csv
node scripts/import-csv.js data/wallet_transactions_sample.csv --clear

# Start MongoDB (local)
brew services start mongodb-community

# Stop MongoDB (local)
brew services stop mongodb-community
```

## Next Steps

- [x] Add database integration (MongoDB) for persistence
- [ ] Add AI integration (budget recommendations, spending insights, predictions)
- [ ] Add authentication
- [ ] Add Feature 3: Rewards and Incentives
- [ ] Build API endpoints
- [ ] Create frontend interface

## License

ISC
