# RU Stable - Smart Campus Wallet

**An all-in-one smart campus wallet built for HackFest 2025 @ Rutgers Newark**

RU Stable helps college students track their meal plans, dining dollars, spending, and campus activities all in one intuitive dashboard. Earn rewards for positive habits like attending events, staying active, and managing your budget effectively.

---

## 🚀 Quick Start - How to Run the Site

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- A terminal/command prompt

### Installation & Running (3 Steps)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Import Sample Data** (Optional - adds demo transactions and events)
   ```bash
   # Import wallet transactions
   node scripts/import-csv.js data/wallet_transactions_sample.csv
   
   # Import campus events
   node scripts/import-events.js
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   ```
   http://localhost:3000
   ```

That's it! The server runs on **port 3000** by default. You should see:
- ✅ Homepage with 3 feature cards
- ✅ Budgeting & Spending page with meal plan tracker
- ✅ My Activity page with campus events
- ✅ Rewards & Incentives page with points and leaderboard

---

## 📁 Project Structure Explained

```
smart-campus-wallet/
├── server.js                 # Main server file - starts Express app
├── package.json              # Dependencies and npm scripts
│
├── db/
│   └── json-db.js           # JSON file-based database (no MongoDB needed!)
│
├── routes/                   # API route handlers
│   ├── transactions.js      # Transaction endpoints
│   ├── budgets.js           # Budget endpoints
│   ├── activities.js        # Events, class attendance, activity logs
│   ├── rewards.js           # Points, streaks, achievements
│   └── mealPlans.js         # Meal swipe tracking
│
├── public/                   # Frontend files (served as static files)
│   ├── index.html           # Homepage
│   ├── budgeting.html       # Budgeting & Spending page
│   ├── activity.html        # My Activity page
│   ├── rewards.html         # Rewards & Incentives page
│   ├── script.js            # Frontend JavaScript (API calls, UI updates)
│   ├── styles.css           # All styling
│   └── assets/              # Images and logos
│
├── data/                     # Sample data and database storage
│   ├── db/
│   │   └── database.json    # JSON database file (auto-created)
│   ├── wallet_transactions_sample.csv
│   └── campus_events_sample.csv
│
├── scripts/                  # Utility scripts
│   ├── import-csv.js        # Import transactions from CSV
│   └── import-events.js     # Import events from CSV
│
└── utils/                    # Helper functions
    ├── csvParser.js         # CSV parsing utilities
    └── rewardsJson.js       # Rewards calculation logic
```

---

## 🏗️ How the Code Works

### Backend Architecture

**1. Server Setup (`server.js`)**
- Creates Express app
- Initializes JSON database (`db/json-db.js`)
- Sets up CORS middleware (allows frontend to connect)
- Registers all API routes
- Serves static files from `public/` folder
- Starts listening on port 3000

**2. Database (`db/json-db.js`)**
- **Custom JSON file-based database** - No MongoDB required!
- Stores all data in `data/db/database.json`
- Provides MongoDB-like methods: `find()`, `findOne()`, `create()`, `update()`, `delete()`
- Collections: `transactions`, `budgets`, `events`, `mealPlans`, `rewardPoints`, `streaks`, etc.

**3. Routes (`routes/*.js`)**
- Each file handles specific API endpoints
- Example: `routes/transactions.js` handles `/api/transactions/*`
- Routes fetch data from JSON database and return JSON responses

### Frontend Architecture

**1. HTML Files (`public/*.html`)**
- Static HTML pages
- Each page loads `script.js` and `styles.css`
- `index.html` = Homepage
- `budgeting.html` = Budgeting & Spending page
- `activity.html` = My Activity page
- `rewards.html` = Rewards & Incentives page

**2. JavaScript (`public/script.js`)**
- **API Integration**: Fetches data from backend API
- **Dynamic Content**: Updates HTML with data from API
- **Event Handlers**: Button clicks, form submissions
- **Chart Creation**: Uses Chart.js library for visualizations

**3. Styling (`public/styles.css`)**
- All CSS for the entire application
- Responsive design
- Dark theme with red accent color (#bd3346)

---

## ✨ Main Features

### 1. Budgeting & Spending
- **Meal Plan Tracker**: Track meal swipes (starts at 220)
  - Click "Use Meal Swipe" button to deduct
  - Shows remaining, total, and used swipes
  - Visual progress bar
- **Spending Dashboard**:
  - Total spent, transaction count, averages
  - Pie chart showing spending by category
  - Line chart showing monthly spending trends
  - Category breakdown list
  - Recent transactions list

### 2. My Activity
- **Campus Events**:
  - Browse all campus events
  - Filter by category (Academic, Social, Sports, etc.)
  - Filter by cost (Free vs Paid)
  - Mark events as "Attending" (earns points!)
  - Unmark to cancel attendance (deducts points)
- **Activity Tracking**:
  - Log physical activities (Gym, Sports, Walk, Run)
  - Track class attendance
  - View activity timeline

### 3. Rewards & Incentives
- **Points System**:
  - Earn points for attending events (150 for free, 300 for paid)
  - Earn points for physical activities
  - Earn points for class attendance
  - Points for maintaining streaks
- **Rewards**:
  - 200 points = $5 gift card (Dunkin, Starbucks, Target, CVS)
  - 1000 points = $10 gift card
  - 10,000 points = **Fire Tier** (50% off all rewards)
- **Streaks**:
  - Class Attendance streak
  - Physical Activities streak
  - Events Attendance streak
  - App Usage streak
- **Leaderboard**:
  - Top 10 users ranked by points
  - Shows tiers (Gold, Silver, Bronze)
  - Top user shows "Fire Tier" badge

---

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and database info.

### Transactions
```
GET /api/transactions?userId=U001
GET /api/transactions/summary?userId=U001
GET /api/transactions/categories?userId=U001
GET /api/transactions/trends?period=monthly&userId=U001
POST /api/transactions
```

### Budgets
```
GET /api/budgets?userId=U001
POST /api/budgets
GET /api/budgets/:id
```

### Activities
```
GET /api/activities/events?category=academic&isFree=true
POST /api/activities/events/:eventId/attend
DELETE /api/activities/events/:eventId/attend
POST /api/activities/logs/:userId
GET /api/activities/summary/:userId
```

### Rewards
```
GET /api/rewards/summary/:userId
GET /api/rewards/points/:userId
GET /api/rewards/streaks/:userId
```

### Meal Plans
```
GET /api/meal-plans/:userId
POST /api/meal-plans/:userId/use-swipe
```

**Note**: Default demo user is `U001`. Replace with any user ID from your data.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Custom JSON Database** - File-based storage (no MongoDB needed!)

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Interactivity
- **Chart.js** - Data visualizations

### Data
- **CSV Files** - Sample transaction and event data
- **JSON File Database** - Persistent storage in `data/db/database.json`

---

## 📊 Sample Data

The project includes sample data:
- **Transactions**: `data/wallet_transactions_sample.csv`
- **Campus Events**: `data/campus_events_sample.csv`

Import them using:
```bash
node scripts/import-csv.js data/wallet_transactions_sample.csv
node scripts/import-events.js
```

---

## 🔧 Available Scripts

```bash
# Start the server
npm start              # Production mode
npm run dev           # Development mode (auto-reload with nodemon)

# Import data
node scripts/import-csv.js data/wallet_transactions_sample.csv
node scripts/import-events.js

# Testing
node scripts/test-api-endpoints.js
```

---

## 📝 Code Examples

### How Frontend Calls Backend API

**Example from `public/script.js`:**
```javascript
// Fetch meal plan data
const response = await fetch(`${API_BASE_URL}/meal-plans/U001`);
const data = await response.json();

// Update UI
document.getElementById('remaining-swipes').textContent = data.data.remainingSwipes;
```

### How Backend Handles Requests

**Example from `routes/mealPlans.js`:**
```javascript
router.get('/:userId', async (req, res) => {
  const mealPlan = await MealPlan.findOne({ userId: req.params.userId });
  res.json({ success: true, data: mealPlan });
});
```

### How Database Works

**Example from `db/json-db.js`:**
```javascript
// Collection class provides MongoDB-like methods
const MealPlan = new Collection('mealPlans');

// Use it like MongoDB
await MealPlan.findOne({ userId: 'U001' });
await MealPlan.create({ userId: 'U001', remainingSwipes: 220 });
await MealPlan.findByIdAndUpdate(id, updates);
```

---

## 🎯 Key Files Explained

### `server.js`
- Entry point of the application
- Creates Express server
- Registers all routes
- Serves static files from `public/` folder
- Handles API requests and returns JSON

### `public/script.js`
- Main frontend JavaScript file
- Contains all API integration functions
- Handles user interactions (button clicks, form submissions)
- Updates DOM to show data
- Creates charts using Chart.js

### `db/json-db.js`
- Custom database implementation
- Reads/writes to `data/db/database.json`
- Provides MongoDB-like API (`find`, `create`, `update`, `delete`)
- Automatically saves changes to file

### `routes/*.js`
- Each file is a router module
- Handles specific API endpoints
- Fetches data from database
- Returns JSON responses

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Make sure you ran `npm install`
- Check for errors in terminal

### No data showing
- Import sample data: `node scripts/import-csv.js data/wallet_transactions_sample.csv`
- Check browser console for API errors
- Verify server is running on port 3000

### Meal plan not working
- Make sure `routes/mealPlans.js` is registered in `server.js`
- Check that `MealPlan` collection is exported from `db/json-db.js`

### Events not loading
- Import events: `node scripts/import-events.js`
- Check `data/db/database.json` for events collection

---

## 📱 Features Overview

✅ **Meal Plan Tracking** - Track and deduct meal swipes  
✅ **Spending Analytics** - Charts and breakdowns  
✅ **Campus Events** - Browse and attend events  
✅ **Activity Logging** - Log gym, sports, walks, runs  
✅ **Rewards System** - Points, streaks, achievements  
✅ **Leaderboard** - Compete with other students  
✅ **Budget Management** - Track spending vs budgets  

---

## 🚢 Deployment

The app can be deployed to:
- **Railway** - Easy Node.js deployment
- **Render** - Free tier available
- **Heroku** - Classic platform
- **Netlify** - For frontend + API functions

No database setup required - uses JSON file storage!

---

## 📄 License

ISC

---

## 👥 Built For

**HackFest 2025 @ Rutgers Newark**

This project helps college students manage their campus finances and stay engaged with campus life through an intuitive, reward-based system.
