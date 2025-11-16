# RU Stable - Smart Campus Wallet

**An all-in-one smart campus wallet built for HackFest 2025 @ Rutgers Newark**

RU Stable helps college students track their meal plans, dining dollars, spending, and campus activities all in one intuitive dashboard. Earn rewards for positive habits like attending events, staying active, and managing your budget effectively.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)

### Installation & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Import Sample Data** (Optional)
   ```bash
   node scripts/import-csv.js data/wallet_transactions_sample.csv
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

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Custom JSON Database** - File-based storage system (no external database required)

### Frontend
- **HTML5** - Structure and markup
- **CSS3** - Styling and responsive design
- **Vanilla JavaScript** - Client-side interactivity
- **Chart.js** - Data visualizations and graphs

### Development Tools
- **Cursor AI** - AI-powered code editor for development assistance
- **Git/GitHub** - Version control and collaboration

---

## 🤖 AI Tools Used

- **Cursor AI** - Assisted with:
  - Code generation and refactoring
  - Debugging and error resolution
  - API endpoint development
  - Frontend-backend integration
  - Documentation generation

---

## ✨ Main Features

### 1. Budgeting & Spending
- **Meal Plan Tracker**
  - Track meal swipes (starts at 220 swipes)
  - One-click button to deduct swipes
  - Visual progress bar and statistics
- **Spending Dashboard**
  - Total spent, transaction count, daily averages
  - Interactive pie charts showing spending by category
  - Monthly spending trend line charts
  - Category breakdown with percentages
  - Recent transactions list

### 2. My Activity
- **Campus Events**
  - Browse all campus events
  - Filter by category (Academic, Social, Sports, etc.)
  - Filter by cost (Free vs Paid)
  - Mark events as "Attending" (automatically earns points)
  - Cancel attendance (deducts points)
- **Activity Tracking**
  - Log physical activities (Gym, Sports, Walk, Run)
  - Track class attendance
  - View comprehensive activity timeline

### 3. Rewards & Incentives
- **Points System**
  - Earn 150 points for attending free events
  - Earn 300 points for attending paid/academic events
  - Points for physical activities and class attendance
  - Bonus points for maintaining streaks
- **Reward Tiers**
  - **200 points** = $5 gift card (Dunkin, Starbucks, Target, CVS)
  - **1,000 points** = $10 gift card
  - **10,000 points** = **Fire Tier** (50% off all rewards)
- **Streaks**
  - Class Attendance streak tracking
  - Physical Activities streak
  - Events Attendance streak
  - App Usage streak
- **Leaderboard**
  - Top 10 users ranked by total points
  - Displays user tiers (Gold, Silver, Bronze)
  - Top-ranked user shows exclusive "Fire Tier" badge

---

## 🔌 API Endpoints

### Transactions
```
GET /api/transactions?userId=U001
GET /api/transactions/summary?userId=U001
GET /api/transactions/categories?userId=U001
```

### Activities
```
GET /api/activities/events?category=academic&isFree=true
POST /api/activities/events/:eventId/attend
```

### Rewards
```
GET /api/rewards/summary/:userId
```

### Meal Plans
```
GET /api/meal-plans/:userId
POST /api/meal-plans/:userId/use-swipe
```

---

## 📁 Project Structure

```
smart-campus-wallet/
├── server.js                 # Express server entry point
├── db/json-db.js            # JSON file-based database
├── routes/                   # API route handlers
├── public/                   # Frontend files (HTML, CSS, JS)
├── data/                     # Sample data and database storage
└── scripts/                  # Utility scripts for data import
```

---

## 📄 License

ISC

---

## 👥 Built For

**HackFest 2025 @ Rutgers Newark**

This project helps college students manage their campus finances and stay engaged with campus life through an intuitive, reward-based system.
