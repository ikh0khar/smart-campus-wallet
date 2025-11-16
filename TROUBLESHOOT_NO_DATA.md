# Troubleshooting: Frontend Works But No Data Loading

## The Problem
- ✅ Frontend loads (HTML/CSS/JS work)
- ❌ No data appears (transactions, budgets, events empty)
- ❌ API calls failing silently

## Root Cause
**MongoDB is not connected!** The server is running, but the database connection failed.

## Quick Diagnosis

### Step 1: Check Diagnostic Endpoint

Visit this URL in your browser:
```
https://your-app.railway.app/api/diagnostic
```

You should see:
```json
{
  "server": "running",
  "mongodb": {
    "uri": "Set" or "NOT SET",
    "state": "connected" or "disconnected",
    "connected": true or false
  }
}
```

### Step 2: Check What You See

**If you see:**
- `"uri": "NOT SET"` → **MONGODB_URI environment variable is missing**
- `"state": "disconnected"` → **MongoDB connection failed**
- `"connected": false` → **Database is not connected**

## Solutions

### Solution 1: MONGODB_URI Not Set

**Fix:**
1. Go to Railway Dashboard → Your Web Service
2. Click "Variables" tab
3. Click "+ New Variable"
4. **Name:** `MONGODB_URI`
5. **Value:** Copy from MongoDB service (see below)
6. Redeploy

**To get MongoDB URI:**
- If using Railway MongoDB:
  1. Go to MongoDB service → Variables tab
  2. Copy `MONGO_URL` value
  3. Paste as `MONGODB_URI` in web service

- If using MongoDB Atlas:
  1. Get connection string from Atlas
  2. Format: `mongodb+srv://user:pass@cluster.mongodb.net/database`
  3. Paste as `MONGODB_URI` in web service

### Solution 2: MongoDB Connection Failed

**Check Railway Logs:**
1. Go to Railway Dashboard → Your Web Service
2. Click "Deployments" → Latest deployment
3. Click "View Logs"
4. Look for MongoDB connection errors

**Common Issues:**
- ❌ Wrong connection string format
- ❌ MongoDB service not running
- ❌ IP not whitelisted (for Atlas)
- ❌ Wrong password/credentials

**Fix:**
1. Verify `MONGODB_URI` is correct
2. Check MongoDB service is running (Railway MongoDB)
3. Whitelist IP in Atlas (Network Access → Allow from anywhere)
4. Redeploy web service

### Solution 3: Database is Empty

Even if connected, you might have no data!

**Fix: Import data:**
1. Connect to your Railway service via terminal/SSH
2. Set `MONGODB_URI` environment variable
3. Run import scripts:
   ```bash
   npm run import data/wallet_transactions_sample.csv
   npm run seed:budgets
   npm run seed:events
   ```

## Testing Checklist

After fixing, test these endpoints:

1. **Health Check:**
   ```
   https://your-app.railway.app/api/health
   ```
   Should show: `"mongodb": { "connected": true }`

2. **Diagnostic:**
   ```
   https://your-app.railway.app/api/diagnostic
   ```
   Should show: `"connected": true`

3. **Transactions:**
   ```
   https://your-app.railway.app/api/transactions
   ```
   Should return data (or empty array if no data imported)

4. **Budgets:**
   ```
   https://your-app.railway.app/api/budgets
   ```
   Should return data (or empty array if no data imported)

## What Changed

I've added:
- ✅ `/api/diagnostic` endpoint to check MongoDB status
- ✅ MongoDB connection checks in all API routes
- ✅ Better error messages when database is not connected
- ✅ Enhanced `/api/health` to show MongoDB status

## Next Steps

1. **Check diagnostic endpoint** → See what's wrong
2. **Fix MONGODB_URI** → Set environment variable
3. **Redeploy** → Let Railway restart with new config
4. **Check logs** → Verify MongoDB connects
5. **Import data** → Populate database
6. **Test endpoints** → Verify data loads

## Still Not Working?

1. Check Railway logs for detailed error messages
2. Verify MongoDB service is running (if using Railway MongoDB)
3. Test connection string locally first
4. Check browser console for API errors
5. Use `/api/diagnostic` to see exact status

---

**The diagnostic endpoint will tell you exactly what's wrong!** 🎯

