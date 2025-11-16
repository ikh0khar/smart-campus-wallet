# Separating Backend and Frontend - Deployment Guide

This guide shows you how to deploy the backend and frontend separately on different platforms.

## Architecture

```
Frontend (Netlify/Vercel)
    ↓ API calls
Backend (Railway/Render)
    ↓ Database queries
MongoDB (Railway/Atlas)
```

## Step 1: Deploy Backend Separately

### Option A: Railway (Recommended)

1. **Create Backend Service:**
   - Go to Railway → New Project
   - Deploy from GitHub → Select your repo → Branch `main-v2`
   - Railway auto-detects it's a Node.js app

2. **Add MongoDB:**
   - Click "+ New" → Database → MongoDB
   - Railway creates free MongoDB instance

3. **Set Environment Variables:**
   - Go to Backend Service → Variables
   - Add: `MONGODB_URI` = (copy from MongoDB service `MONGO_URL`)
   - Add: `NODE_ENV` = `production`

4. **Get Backend URL:**
   - Railway gives you a URL like: `https://backend-app.up.railway.app`
   - Copy this URL - you'll need it for frontend

5. **Configure Health Check:**
   - Settings → Healthcheck Path: `/api/health`

### Option B: Render

1. **Create Web Service:**
   - Render → New → Web Service
   - Connect GitHub repo → Branch `main-v2`

2. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Add MongoDB:**
   - New → Database → MongoDB

4. **Set Environment Variables:**
   - Add: `MONGODB_URI` = (MongoDB connection string)
   - Add: `NODE_ENV` = `production`

5. **Get Backend URL:**
   - Render gives you: `https://backend-app.onrender.com`

## Step 2: Configure CORS for Backend

Your backend already has CORS enabled, but we should restrict it to your frontend domain.

### Update `server.js` CORS Configuration:

```javascript
// Current (allows all origins):
app.use(cors({
  origin: '*',
  ...
}));

// Production (restrict to your frontend):
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Add your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Set in Backend Environment Variables:**
- `FRONTEND_URL` = `https://your-frontend.netlify.app` (your frontend URL)

## Step 3: Deploy Frontend Separately

### Option A: Netlify (Recommended for Static Sites)

1. **Prepare Frontend:**
   - Frontend files are already in `public/` folder
   - This is good - Netlify can serve from `public/`

2. **Deploy:**
   - Go to Netlify → Add new site → Import from GitHub
   - Select your repo → Branch `main-v2`
   - Build settings:
     - Build command: (leave empty - no build needed)
     - Publish directory: `public`

3. **Configure Environment Variables:**
   - Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://your-backend.railway.app/api`
     - Or `REACT_APP_API_URL` if using Create React App

4. **Get Frontend URL:**
   - Netlify gives you: `https://your-site.netlify.app`

### Option B: Vercel

1. **Deploy:**
   - Vercel → New Project → Import GitHub repo
   - Framework Preset: Other
   - Root Directory: `public`

2. **Environment Variables:**
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api`

3. **Get Frontend URL:**
   - Vercel gives you: `https://your-site.vercel.app`

## Step 4: Update Frontend to Use Backend URL

### Current Setup (Same Domain):

The frontend currently uses:
```javascript
const API_BASE_URL = window.location.origin + '/api';
```

This works when backend and frontend are on the same domain, but won't work when separated.

### Update for Separate Deployment:

**Option 1: Environment Variable (Recommended)**

Update `public/script.js`:

```javascript
// API Configuration
const API_BASE_URL = (() => {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // For production, use environment variable or backend URL
    // Netlify: Use VITE_API_URL
    // Vercel: Use NEXT_PUBLIC_API_URL
    // Or set directly in build time
    return window.API_BACKEND_URL || process.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://your-backend.railway.app/api';
})();
```

**Option 2: Direct Backend URL (Simpler)**

Update `public/script.js`:

```javascript
// API Configuration
const API_BASE_URL = (() => {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // Production: Replace with your backend URL
    return 'https://your-backend.railway.app/api';
    // Or for Render:
    // return 'https://your-backend.onrender.com/api';
})();
```

### Option 3: Configuration File (Best Practice)

Create `public/config.js`:

```javascript
// API Configuration
window.APP_CONFIG = {
    API_BASE_URL: 'https://your-backend.railway.app/api'
};
```

Then in `public/index.html`, add before closing `</head>`:

```html
<script src="/config.js"></script>
```

And in `public/script.js`:

```javascript
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || window.location.origin + '/api';
```

## Step 5: Update Backend CORS

After deploying frontend, update backend CORS to allow your frontend:

**In Railway/Render Backend Environment Variables:**
- Add: `FRONTEND_URL` = `https://your-frontend.netlify.app`

**Update `server.js`:**

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If you need cookies/auth
}));
```

## Step 6: Test Connection

1. **Backend Health:**
   ```
   https://your-backend.railway.app/api/health
   ```
   Should return: `{"status":"OK",...}`

2. **Backend Diagnostic:**
   ```
   https://your-backend.railway.app/api/diagnostic
   ```
   Should show MongoDB connected

3. **Frontend:**
   - Visit your frontend URL
   - Open browser console (F12)
   - Check Network tab for API calls
   - Should see calls to backend URL

4. **Test API from Frontend:**
   - Try loading a page that fetches data
   - Check if data loads
   - Check console for errors

## Complete Deployment Checklist

### Backend (Railway/Render):
- [ ] Backend deployed and running
- [ ] MongoDB service added
- [ ] `MONGODB_URI` environment variable set
- [ ] `NODE_ENV=production` set
- [ ] `FRONTEND_URL` set (optional but recommended)
- [ ] Health check works: `/api/health`
- [ ] Backend URL copied: `https://...`

### Frontend (Netlify/Vercel):
- [ ] Frontend deployed
- [ ] API URL updated in `public/script.js`
- [ ] Environment variable set (if using)
- [ ] Frontend URL copied: `https://...`
- [ ] Test frontend loads

### Connection:
- [ ] Backend CORS allows frontend domain
- [ ] Frontend points to correct backend URL
- [ ] Test API calls work from frontend
- [ ] Data loads on frontend

## Advantages of Separation

✅ **Scalability:** Scale frontend and backend independently
✅ **Performance:** Use CDN for frontend (faster)
✅ **Cost:** Use free tier for static frontend
✅ **Flexibility:** Easy to change backend without affecting frontend
✅ **Specialization:** Use best platform for each (Netlify for static, Railway for Node.js)

## Disadvantages

❌ **CORS configuration:** Need to manage CORS
❌ **Multiple deployments:** Two services to maintain
❌ **API URL management:** Need to keep frontend URL updated
❌ **Cost:** Two services (though both have free tiers)

## Troubleshooting

### Issue: CORS Errors

**Error:** `Access-Control-Allow-Origin` error in browser console

**Fix:**
1. Check backend CORS configuration
2. Verify `FRONTEND_URL` is set in backend
3. Make sure frontend URL matches exactly (no trailing slash)
4. Check backend allows your frontend origin

### Issue: API Calls Failing

**Error:** 404 or Network error

**Fix:**
1. Verify API URL in frontend is correct
2. Check backend is running (test `/api/health`)
3. Check Network tab for actual URL being called
4. Verify backend route exists

### Issue: Mixed Content (HTTP/HTTPS)

**Error:** Browser blocks HTTP requests from HTTPS site

**Fix:**
- Make sure backend URL uses HTTPS (`https://`)
- Railway and Render both provide HTTPS by default

## Quick Reference

### Backend URLs:
- Railway: `https://app-name.up.railway.app`
- Render: `https://app-name.onrender.com`

### Frontend URLs:
- Netlify: `https://app-name.netlify.app`
- Vercel: `https://app-name.vercel.app`

### API Endpoints:
- Health: `https://backend-url/api/health`
- Transactions: `https://backend-url/api/transactions`
- Budgets: `https://backend-url/api/budgets`
- Events: `https://backend-url/api/activities/events`

---

**Ready to separate? Follow the steps above and your backend and frontend will be on different platforms!** 🚀

