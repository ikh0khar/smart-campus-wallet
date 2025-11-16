# Setting Up MongoDB on Railway - Quick Guide

## The Problem
You're seeing:
- `MongoDB URI: NOT SET - using default`
- `MongoDB: Not connected`

This means the `MONGODB_URI` environment variable is missing.

## Solution: Set MongoDB URI in Railway

### Option 1: Use Railway MongoDB (Easiest - Recommended)

1. **Add MongoDB Service:**
   - In Railway Dashboard → Your Project
   - Click "+ New" button
   - Select "Database" → "MongoDB"
   - Railway will create a free MongoDB instance

2. **Get Connection String:**
   - Click on the MongoDB service you just created
   - Go to "Variables" tab
   - Look for `MONGO_URL` or `MONGODB_URI`
   - **Copy the entire connection string** (it will look like: `mongodb://mongo:27017` or `mongodb+srv://...`)

3. **Set in Web Service:**
   - Go back to your Web Service (the Node.js app)
   - Click on "Variables" tab
   - Click "+ New Variable"
   - **Name:** `MONGODB_URI`
   - **Value:** Paste the connection string from step 2
   - Click "Add"

4. **Redeploy:**
   - Railway usually auto-redeploys when you add variables
   - Or manually: Deployments → Redeploy

### Option 2: Use MongoDB Atlas (Cloud)

1. **Create Atlas Cluster:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create a free cluster (M0)
   - Wait for cluster to deploy (~5 minutes)

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/smart-campus-wallet?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password

3. **Whitelist IP (Important!):**
   - In Atlas → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add Railway IPs)
   - This allows Railway to connect

4. **Set in Railway:**
   - Go to your Railway Web Service
   - Variables tab → "+ New Variable"
   - **Name:** `MONGODB_URI`
   - **Value:** Paste your Atlas connection string
   - Click "Add"

5. **Redeploy:**
   - Railway will auto-redeploy

## Quick Steps Summary

### If using Railway MongoDB:
1. Add MongoDB service to project
2. Copy `MONGO_URL` from MongoDB service variables
3. Add as `MONGODB_URI` in web service variables
4. Redeploy

### If using MongoDB Atlas:
1. Create Atlas cluster
2. Get connection string
3. Whitelist IP (allow from anywhere)
4. Add as `MONGODB_URI` in Railway web service
5. Redeploy

## Verify It's Working

After setting `MONGODB_URI` and redeploying, check logs. You should see:

✅ **Success:**
```
💾 MongoDB URI: Set
✅ MongoDB: Connected
✅ MongoDB Connected: [hostname]
```

❌ **Still Not Working:**
```
💾 MongoDB URI: Set
⚠️ MongoDB: Not connected
```

If still not connected, check:
- Connection string format is correct
- No extra spaces in the URI
- Password is URL-encoded if it has special characters
- IP is whitelisted (for Atlas)
- MongoDB service is running (Railway MongoDB)

## Common Mistakes

1. **Wrong Variable Name:**
   - ❌ `MONGO_URL` (Railway uses this for MongoDB service)
   - ✅ `MONGODB_URI` (Your app expects this)

2. **Not Copying Full String:**
   - Make sure you copy the ENTIRE connection string
   - Don't miss parts like `?retryWrites=true&w=majority`

3. **Forgot to Redeploy:**
   - Adding variables triggers auto-redeploy
   - But sometimes you need to manually redeploy

4. **Atlas IP Not Whitelisted:**
   - Must allow Railway to connect
   - Use "Allow Access from Anywhere" for testing

## Still Having Issues?

Check `RAILWAY_TROUBLESHOOTING.md` for more detailed help!

