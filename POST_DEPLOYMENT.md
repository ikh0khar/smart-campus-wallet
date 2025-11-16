# Post-Deployment Checklist 🚀

Your app is now live! Follow these steps to get everything working.

## Step 1: Verify Deployment ✅

1. **Visit your deployed URL:**
   - Railway: `https://your-app-name.up.railway.app`
   - Render: `https://your-app-name.onrender.com`

2. **Test the homepage:**
   - Should load without errors
   - Check browser console for any errors

3. **Test API health:**
   - Visit: `https://your-app-url/api/health`
   - Should return: `{"status":"OK","message":"Smart Campus Wallet API is running"}`

## Step 2: Set Up MongoDB Data 📊

Your MongoDB database needs initial data. You have two options:

### Option A: Use MongoDB Atlas (Cloud) - Recommended

1. **Get your MongoDB URI:**
   - If using Railway: Check your MongoDB service → Variables → `MONGO_URL`
   - If using Render: Check your MongoDB service → Connection String
   - If using MongoDB Atlas: Get connection string from Atlas dashboard

2. **Update environment variable:**
   - In Railway/Render: Update `MONGODB_URI` to your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/smart-campus-wallet`

### Option B: Connect to Local MongoDB (Development Only)

If testing locally, you can connect to local MongoDB first, import data, then migrate.

## Step 3: Import Initial Data 📥

You need to run these import scripts to populate your database:

### 3.1 Import Transactions

```bash
# Connect to your deployed app via SSH/Terminal
# Or run locally pointing to production MongoDB

# Set MongoDB URI
export MONGODB_URI="your-production-mongodb-uri"

# Import transactions
npm run import data/wallet_transactions_sample.csv
```

### 3.2 Seed Budgets

```bash
npm run seed:budgets
```

### 3.3 Seed Events

```bash
npm run seed:events
```

## Step 4: Test All Features 🧪

### Frontend Pages:
- [ ] Homepage (`/`) loads
- [ ] Budgeting page (`/budgeting.html`) loads
- [ ] Activity page (`/activity.html`) loads
- [ ] Rewards page (`/rewards.html`) loads

### API Endpoints:
- [ ] GET `/api/health` - Returns OK
- [ ] GET `/api/transactions` - Returns transaction list
- [ ] GET `/api/budgets` - Returns budget list
- [ ] GET `/api/activities/events` - Returns events list
- [ ] GET `/api/rewards/summary/user123` - Returns rewards data

### Features:
- [ ] View transactions on budgeting page
- [ ] Add new transaction (if form is present)
- [ ] View budgets and progress
- [ ] Browse events on activity page
- [ ] Mark event attendance
- [ ] Log class attendance
- [ ] Log physical activities
- [ ] View rewards and points

## Step 5: Common Issues & Fixes 🔧

### Issue: "Cannot GET /api/..."
**Fix:** Make sure your deployment platform is running Node.js and Express

### Issue: "MongoDB connection error"
**Fix:** 
- Check `MONGODB_URI` environment variable
- Verify MongoDB is accessible from your deployment platform
- Check firewall/network settings

### Issue: "Empty data / No transactions"
**Fix:** Run import scripts (Step 3)

### Issue: "CORS errors"
**Fix:** Already handled in `server.js` with CORS middleware

### Issue: "Page not found"
**Fix:** Check that `server.js` is serving static files correctly

## Step 6: Environment Variables Checklist 🔐

Make sure these are set in your deployment platform:

- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `PORT` - Usually set automatically (3000 for Railway, 10000 for Render)
- [ ] `NODE_ENV=production` - Set to production

## Step 7: Custom Domain (Optional) 🌐

### Railway:
1. Go to project → Settings → Domains
2. Click "Generate Domain" or "Add Custom Domain"
3. Follow DNS setup instructions

### Render:
1. Go to service → Settings → Custom Domains
2. Add your domain
3. Configure DNS records

## Step 8: Monitor & Maintain 📊

### Check Logs:
- Railway: Project → Deployments → View logs
- Render: Dashboard → Your service → Logs

### Monitor:
- API response times
- Error rates
- Database connections
- Resource usage

## Quick Test Commands

```bash
# Test API health
curl https://your-app-url/api/health

# Test transactions
curl https://your-app-url/api/transactions

# Test budgets
curl https://your-app-url/api/budgets
```

## Need Help? 🆘

- Check logs in your deployment platform
- Verify environment variables are set correctly
- Test API endpoints directly with curl or Postman
- Check MongoDB connection string format
- Ensure all dependencies are in `package.json`

---

**Congratulations! Your app is live! 🎉**

Next steps:
1. Import your data
2. Test all features
3. Set up custom domain (optional)
4. Share with your team/users!

