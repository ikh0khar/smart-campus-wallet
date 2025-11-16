# Railway Deployment Troubleshooting Guide

## Common Issues and Fixes

### Issue 1: Server Crashes on Startup

**Symptoms:**
- Deployment shows "Build Succeeded" but service shows "Failed"
- Logs show MongoDB connection error then exit

**Fix:**
✅ **DONE** - Server no longer exits on MongoDB failure. It will start and retry connection.

### Issue 2: MongoDB Connection Error

**Symptoms:**
- Server starts but API calls fail
- Logs show "MongoDB connection error"

**Solution:**

1. **Check Environment Variables:**
   - Go to Railway Dashboard → Your Service → Variables
   - Make sure `MONGODB_URI` is set
   - Format should be: `mongodb+srv://username:password@cluster.mongodb.net/database`

2. **If using Railway MongoDB:**
   - Go to your MongoDB service in Railway
   - Click "Variables" tab
   - Copy the `MONGO_URL` value
   - In your web service, set `MONGODB_URI` = `MONGO_URL` value

3. **If using MongoDB Atlas:**
   - Make sure your IP is whitelisted (or use `0.0.0.0/0` for all IPs)
   - Check connection string format
   - Ensure username/password are URL-encoded if they contain special characters

4. **Test Connection:**
   - Check Railway logs for connection status
   - Visit `/api/health` - should return OK even if MongoDB is down

### Issue 3: Port Issues

**Symptoms:**
- Server starts but Railway can't route traffic
- Health checks fail

**Solution:**
✅ **DONE** - Server now listens on `0.0.0.0` and uses `process.env.PORT`

**Railway automatically sets PORT**, so make sure your `server.js` uses:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ...);
```

### Issue 4: Build Fails

**Symptoms:**
- Deployment shows "Build Failed"

**Solutions:**

1. **Check package.json:**
   - Make sure all dependencies are listed
   - Check Node version compatibility

2. **Check Railway Build Logs:**
   - Go to Deployment → View Logs
   - Look for npm install errors
   - Check for missing dependencies

3. **Common Build Issues:**
   - Missing dependencies in package.json
   - Node version mismatch
   - Native module compilation errors

### Issue 5: Health Check Fails

**Symptoms:**
- Service shows unhealthy
- Health check endpoint returns error

**Solution:**

1. **Check health check path:**
   - Railway: Settings → Healthcheck Path should be `/api/health`
   - Or remove healthcheck if not needed

2. **Verify endpoint works:**
   - Visit: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"OK","message":"Smart Campus Wallet API is running"}`

### Issue 6: Static Files Not Loading

**Symptoms:**
- Frontend loads but assets missing
- 404 errors for CSS/JS/images

**Solution:**

1. **Check public folder:**
   - Make sure `public/` folder exists
   - Verify files are in repository
   - Check `.gitignore` doesn't exclude `public/`

2. **Verify Express static middleware:**
   - Check `server.js` serves static files
   - Path should be `public/` relative to project root

### Issue 7: Environment Variables Not Working

**Symptoms:**
- Server uses default values
- MongoDB connection uses localhost

**Solution:**

1. **Set in Railway Dashboard:**
   - Service → Variables → Add Variable
   - Name: `MONGODB_URI`
   - Value: Your MongoDB connection string
   - **Important:** Redeploy after adding variables

2. **Verify Variables:**
   - Check logs on deployment
   - Should see "MongoDB URI: Set" in startup logs

3. **Variable Names:**
   - Railway MongoDB uses `MONGO_URL` (not `MONGODB_URI`)
   - Copy value from MongoDB service to your web service as `MONGODB_URI`

## Step-by-Step Railway Setup

### 1. Create Services

1. **Web Service:**
   - New Project → Deploy from GitHub
   - Select repository and branch
   - Railway auto-detects Node.js

2. **MongoDB Service (Optional):**
   - Add Service → Database → MongoDB
   - Railway creates free MongoDB instance

### 2. Configure Environment Variables

**For Web Service:**
```
MONGODB_URI=<from MongoDB service MONGO_URL>
NODE_ENV=production
PORT=3000 (auto-set by Railway, but good to have)
```

**To get MongoDB URI from Railway MongoDB:**
1. Open MongoDB service
2. Go to Variables tab
3. Copy `MONGO_URL` value
4. Paste as `MONGODB_URI` in web service

### 3. Configure Health Check

1. Go to Web Service → Settings
2. Healthcheck Path: `/api/health`
3. Healthcheck Timeout: 100 seconds

### 4. Deploy

1. Railway auto-deploys on git push
2. Or manually: Deployments → Redeploy

### 5. Check Logs

1. Go to Deployments → Latest
2. Click "View Logs"
3. Look for:
   - ✅ Server is running on port...
   - ✅ MongoDB Connected (or ⚠️ if not connected)

## Quick Debug Checklist

- [ ] `MONGODB_URI` environment variable is set
- [ ] Server logs show "Server is running on port..."
- [ ] Health check `/api/health` returns OK
- [ ] MongoDB connection shows in logs (✅ or ⚠️)
- [ ] Static files are in `public/` folder
- [ ] All dependencies in `package.json`
- [ ] `.env` file is NOT deployed (use Railway variables instead)

## Testing Your Deployment

1. **Test Health Endpoint:**
   ```bash
   curl https://your-app.railway.app/api/health
   ```
   Should return: `{"status":"OK","message":"Smart Campus Wallet API is running"}`

2. **Test Homepage:**
   - Visit: `https://your-app.railway.app/`
   - Should load homepage

3. **Test API:**
   ```bash
   curl https://your-app.railway.app/api/transactions
   ```
   - If MongoDB connected: Returns data or empty array
   - If MongoDB not connected: Returns error (check logs)

4. **Check Logs:**
   - Railway Dashboard → Deployments → View Logs
   - Look for errors or connection issues

## Need More Help?

1. **Check Railway Logs** - Most issues show in logs
2. **Test Locally** - Make sure it works locally first
3. **Verify Environment Variables** - Double-check all are set
4. **Railway Docs** - https://docs.railway.app/
5. **Railway Discord** - Community support

