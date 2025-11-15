# Smart Campus Wallet - Feature Planning

## Feature 1: Spending Dashboard + Budgeting (First Priority)

### Core Functionality Needed:

#### Spending Dashboard:
- **View transactions** - List all transactions with filters (date range, category, amount)
- **Category breakdown** - Show spending by category (dining, books, transportation, entertainment, utilities, other)
- **Time-based views** - Daily, weekly, monthly, semester views
- **Visualizations** - Charts/graphs for spending patterns
- **Spending summary** - Total spent, average per day/week/month

#### Budgeting:
- **Create budgets** - Set budget limits per category and time period
- **Track progress** - Show how much spent vs. budgeted
- **Alerts/warnings** - Notify when approaching or exceeding budget
- **Budget history** - View past budgets and performance

### API Endpoints Needed:

#### Spending Dashboard:
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/summary` - Get spending summary (totals, averages, by category)
- `GET /api/transactions/categories` - Get spending breakdown by category
- `GET /api/transactions/trends` - Get spending trends over time

#### Budgeting:
- `GET /api/budgets` - Get all budgets for user
- `POST /api/budgets` - Create a new budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget
- `GET /api/budgets/:id/progress` - Get budget progress (spent vs. budgeted)
- `GET /api/budgets/alerts` - Get budgets that are close to or over limit

### AI Integration Ideas:
- **Spending insights** - "Explain my spending this week in simple terms"
- **Budget recommendations** - "Suggest a realistic budget based on my spending history"
- **Spending alerts** - "You're spending 30% more on dining this month - here's why"
- **Smart summaries** - Generate natural language summaries of spending patterns
- **Predictions** - "At this rate, you'll exceed your dining budget in 5 days"

### Data Models Needed:
- **Transaction** - amount, category, date, description, location
- **Budget** - category, amount, period (daily/weekly/monthly/semester), start/end dates
- **User** - basic user info (for authentication)

---

## Feature 2: My Activity (Second Priority)
- Track events attended
- Combine events with spending
- Activity timeline
- *Details to be planned after Feature 1*

## Feature 3: Rewards and Incentives (Third Priority)
- Points system
- Rewards for positive habits
- Streaks and achievements
- *Details to be planned after Feature 2*

