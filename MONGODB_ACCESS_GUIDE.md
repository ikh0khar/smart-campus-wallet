# MongoDB Access Guide

## Quick Access Methods

### 1. MongoDB Shell (Command Line)

**Connect to your database:**
```bash
# Using mongosh (MongoDB Shell v6+)
mongosh mongodb://localhost:27017/smart-campus-wallet

# Or connect and then use database
mongosh
use smart-campus-wallet
```

**Common Commands:**
```javascript
// Show all databases
show dbs

// Switch to your database
use smart-campus-wallet

// Show all collections
show collections

// Query transactions
db.transactions.find().pretty()
db.transactions.find({ userId: "U001" }).pretty()

// Count documents
db.transactions.countDocuments()
db.budgets.countDocuments()
db.users.countDocuments()

// Find one transaction
db.transactions.findOne({ transactionId: "T0001" })

// Query by category
db.transactions.find({ category: "Dining" }).limit(5).pretty()

// Aggregation example
db.transactions.aggregate([
  { $match: { userId: "U001" } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } }
])

// Query budgets
db.budgets.find().pretty()
db.budgets.find({ isActive: true }).pretty()

// Query users
db.users.find().pretty()
```

**Exit shell:**
```bash
exit
```

### 2. MongoDB Compass (GUI Tool)

**Install MongoDB Compass:**
1. Download from: https://www.mongodb.com/try/download/compass
2. Install the application
3. Open Compass

**Connect:**
- Connection String: `mongodb://localhost:27017`
- Or click "Fill in connection fields individually":
  - Host: `localhost`
  - Port: `27017`
  - Authentication: None (for local)
- Click "Connect"

**Browse your database:**
- Select `smart-campus-wallet` database
- Click on collections:
  - `transactions` - View all 200 transactions
  - `budgets` - View all budgets
  - `users` - View all users

**Features:**
- Visual query builder
- Document editor
- Schema analyzer
- Index management
- Performance monitoring

### 3. VS Code Extension

**Install MongoDB for VS Code:**
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "MongoDB for VS Code"
4. Install by MongoDB Inc.

**Connect:**
- Click MongoDB icon in sidebar
- Click "Add Connection"
- Enter: `mongodb://localhost:27017`
- Name it "Local MongoDB"
- Click "Connect"

**Browse:**
- Expand connection → Databases → `smart-campus-wallet`
- Click on collections to view documents
- Right-click to run queries

### 4. From Your Node.js Application

**In your code:**
```javascript
const { Transaction, Budget, User } = require('./models');
const connectDB = require('./config/database');

async function example() {
  await connectDB();
  
  // Query transactions
  const transactions = await Transaction.find({ userId: 'U001' });
  console.log(transactions);
  
  // Query budgets
  const budgets = await Budget.find({ isActive: true });
  console.log(budgets);
  
  // Query users
  const users = await User.find();
  console.log(users);
}
```

**Via API endpoints:**
```bash
# Get all transactions
curl http://localhost:3000/api/transactions

# Get transactions for user U001
curl http://localhost:3000/api/transactions?userId=U001

# Get budgets
curl http://localhost:3000/api/budgets

# Get transaction summary
curl http://localhost:3000/api/transactions/summary?startDate=2025-10-01&endDate=2025-10-31
```

## Connection Details

### Local MongoDB Connection String
```
mongodb://localhost:27017/smart-campus-wallet
```

### Your Current Configuration
Check `.env` file:
```bash
cat .env
```

Or in your code:
```javascript
process.env.MONGODB_URI
```

## Useful Queries

### Transactions Queries

```javascript
// Get all transactions for a user
db.transactions.find({ userId: "U001" }).sort({ date: -1 })

// Get transactions by category
db.transactions.find({ category: "Dining" })

// Get transactions in date range
db.transactions.find({
  date: {
    $gte: ISODate("2025-10-01"),
    $lte: ISODate("2025-10-31")
  }
})

// Get total spending per user
db.transactions.aggregate([
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])

// Get spending by category
db.transactions.aggregate([
  { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } }
])
```

### Budget Queries

```javascript
// Get all active budgets
db.budgets.find({ isActive: true })

// Get budgets for a user
db.budgets.find({ userId: "U001" })

// Get budgets by category
db.budgets.find({ category: "food" })
```

### User Queries

```javascript
// Get all users
db.users.find()

// Get user by ID
db.users.findOne({ userId: "U001" })

// Count users
db.users.countDocuments()
```

## Checking MongoDB Status

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Check MongoDB logs
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

## Database Statistics

```javascript
// In MongoDB shell
use smart-campus-wallet

// Get collection stats
db.transactions.stats()
db.budgets.stats()
db.users.stats()

// Get database stats
db.stats()
```

## Troubleshooting

### Cannot Connect
1. Check if MongoDB is running:
   ```bash
   brew services list | grep mongodb
   ```

2. Check connection string in `.env`:
   ```bash
   cat .env | grep MONGODB_URI
   ```

3. Test connection:
   ```bash
   npm run test:connection
   ```

### Permission Denied
- Make sure MongoDB is running as your user
- Check file permissions in MongoDB data directory

### Port Already in Use
- Check if another MongoDB instance is running
- Use `lsof -i :27017` to see what's using the port

## Quick Reference

| Action | Command |
|--------|---------|
| Connect to MongoDB | `mongosh mongodb://localhost:27017/smart-campus-wallet` |
| List databases | `show dbs` |
| Use database | `use smart-campus-wallet` |
| List collections | `show collections` |
| Count documents | `db.transactions.countDocuments()` |
| Find all | `db.transactions.find().pretty()` |
| Find one | `db.transactions.findOne()` |
| Exit shell | `exit` |

## Recommended Tools

1. **MongoDB Compass** - Best GUI tool (official)
2. **VS Code MongoDB Extension** - Good for development
3. **mongosh** - Command line (included with MongoDB)
4. **Studio 3T** - Alternative GUI tool

Choose the method that works best for your workflow!

