# Complete Deployment Guide - JSON Database

This app now uses a **JSON file-based database** instead of MongoDB. This means:

✅ **No external database setup needed**
✅ **Works on Railway, Render, Netlify Functions, or any Node.js host**
✅ **Data persists in `data/db/database.json`**
✅ **Can deploy frontend + backend together or separately**

## Quick Start

### 1. Local Development

```bash
npm install
npm start
```

The server will:
- Create `data/db/database.json` automatically
- Serve frontend from `public/` folder
- API available at `http://localhost:3000/api`

### 2. Import Sample Data

```bash
# Import transactions from CSV
npm run import data/wallet_transactions_sample.csv

# Seed budgets and events
npm run seed:budgets
npm run seed:events
```

### 3. Deploy to Railway (Recommended)

Railway can host both frontend and backend together:

1. **Connect GitHub repo** to Railway
2. **Select branch:** `main-v2`
3. **Build settings:**
   - Build command: (leave empty)
   - Start command: `npm start`
4. **Environment variables:**
   - `NODE_ENV=production`
   - `PORT` (auto-set by Railway)
5. **Deploy!**

**That's it!** No MongoDB setup needed.

#### Data Persistence on Railway

- Data is stored in `data/db/database.json`
- On Railway, this file persists in the container
- **Note:** For production, consider backing up `data/db/database.json` periodically

### 4. Deploy to Netlify (Frontend Only)

If you want to deploy frontend separately:

1. **Update `public/config.js`:**
   ```javascript
   window.APP_CONFIG = {
       API_BASE_URL: 'https://your-railway-backend.up.railway.app/api'
   };
   ```

2. **Deploy to Netlify:**
   - Connect GitHub repo
   - Branch: `main-v2`
   - Build command: (empty)
   - Publish directory: `public`

3. **Update Railway CORS:**
   - Set `FRONTEND_URL=https://your-site.netlify.app` in Railway

### 5. Deploy to Render

Same as Railway:

1. **New Web Service**
2. **Connect GitHub repo**
3. **Settings:**
   - Build command: (empty)
   - Start command: `npm start`
4. **Environment:**
   - `NODE_ENV=production`
5. **Deploy!**

## File Structure

```
smart-campus-wallet/
├── public/              # Frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── budgeting.html
│   ├── activity.html
│   ├── rewards.html
│   ├── config.js        # Backend API URL config
│   └── script.js
├── routes/              # API routes
│   ├── transactions.js
│   ├── budgets.js
│   ├── activities.js
│   └── rewards.js
├── db/
│   └── json-db.js       # JSON file database
├── data/
│   └── db/
│       └── database.json # Actual data storage
├── server.js            # Express server
└── package.json
```

## Database Location

**Data is stored in:** `data/db/database.json`

This file contains all:
- Users
- Transactions
- Budgets
- Events
- Event Attendances
- Class Attendances
- Activity Logs
- Reward Points
- Streaks
- Achievements

## Backing Up Data

To backup your database:

```bash
# Copy the database file
cp data/db/database.json backup/database-$(date +%Y%m%d).json
```

Or commit it to git (for small datasets):
```bash
git add data/db/database.json
git commit -m "Backup database"
```

## Environment Variables

### Required
- None! JSON database works out of the box.

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)
- `FRONTEND_URL` - For CORS if deploying frontend separately

## Troubleshooting

### Issue: No data loading

**Check:**
1. Is `data/db/database.json` created? (auto-created on first run)
2. Did you import sample data? (`npm run import`)
3. Check server logs for errors

### Issue: Changes not persisting

**Fix:**
- Make sure `data/db/` directory is writable
- Check file permissions: `chmod 755 data/db`

### Issue: Database file too large

**For production:**
- Consider migrating to MongoDB Atlas if data grows
- Or use external JSON storage (S3, etc.)

## Advantages of JSON Database

✅ **Zero setup** - Works immediately
✅ **No external services** - No MongoDB connection needed
✅ **Easy backups** - Just copy one file
✅ **Works anywhere** - Any Node.js host
✅ **Fast for small datasets** - Perfect for demo/development
✅ **Version control friendly** - Can commit data to git

## Migration Path

If you outgrow JSON database:

1. **Keep JSON as fallback** - Database abstraction layer
2. **Add MongoDB option** - Use `MONGODB_URI` env var to switch
3. **Gradual migration** - Export JSON → Import to MongoDB

---

**You're ready to deploy! No MongoDB setup needed!** 🚀
