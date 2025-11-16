# Full-Stack Deployment Guide

## Your App is Already One Site! 🎉

Your Express.js app **already serves both frontend and backend together**:
- Backend API: `/api/*` routes
- Frontend: Served from `public/` folder
- Single server: `server.js` handles everything

You just need to deploy the **entire app** to a platform that supports Node.js.

## Option 1: Railway (Recommended - Easiest)

Railway is perfect for full-stack Node.js apps and has a free tier.

### Steps:

1. **Go to Railway:**
   - Visit https://railway.app/
   - Sign up/login with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `ikh0khar/smart-campus-wallet`
   - Select branch: `main-v2`

3. **Add MongoDB (Free):**
   - Click "+ New" in your project
   - Select "Database" → "MongoDB"
   - Railway will create a free MongoDB instance
   - Copy the connection string

4. **Configure Environment Variables:**
   - In your service, go to "Variables" tab
   - Add:
     ```
     MONGODB_URI=<paste the connection string from step 3>
     PORT=3000
     NODE_ENV=production
     ```

5. **Deploy:**
   - Railway auto-detects Node.js apps
   - It will automatically run `npm install` and `npm start`
   - Your app will be live in 2-3 minutes!

6. **Get Your URL:**
   - Railway gives you a URL like: `https://smart-campus-wallet-production.up.railway.app`
   - Click on it to see your full site (frontend + backend)

7. **Custom Domain (Optional):**
   - In Railway dashboard → Settings → Domains
   - Click "Generate Domain" or add your own
   - Follow DNS setup instructions

### Update Frontend API URL (After Deployment)

After deploying, update `public/script.js` to use Railway's URL:

```javascript
const API_BASE_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // Update this with your Railway URL
    return 'https://smart-campus-wallet-production.up.railway.app/api';
})();
```

Or better yet, keep it dynamic:

```javascript
const API_BASE_URL = window.location.origin + '/api';
```

This will automatically use the same domain (Railway URL) for API calls.

---

## Option 2: Render (Also Great)

Render also supports full-stack apps and has a free tier.

### Steps:

1. **Go to Render:**
   - Visit https://render.com/
   - Sign up/login with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select repo: `ikh0khar/smart-campus-wallet`
   - Branch: `main-v2`

3. **Configure Service:**
   - **Name:** smart-campus-wallet
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

4. **Add MongoDB:**
   - Click "New +" → "MongoDB"
   - Choose free plan
   - Copy the connection string

5. **Add Environment Variables:**
   - In your web service → Environment
   - Add:
     ```
     MONGODB_URI=<connection string from step 4>
     NODE_ENV=production
     PORT=10000
     ```
   - Note: Render uses port 10000 by default

6. **Update PORT in server.js:**
   - Render sets `PORT` automatically, but ensure `server.js` uses `process.env.PORT`

7. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Your site will be at: `https://smart-campus-wallet.onrender.com`

8. **Custom Domain:**
   - Settings → Custom Domains
   - Add your domain and configure DNS

---

## Option 3: Vercel (If You Prefer)

Vercel is great but requires using serverless functions for the backend. More setup required.

---

## Quick Comparison

| Platform | Free Tier | Ease of Setup | Best For |
|----------|-----------|---------------|----------|
| **Railway** | ✅ Yes | ⭐⭐⭐⭐⭐ | Full-stack apps |
| **Render** | ✅ Yes | ⭐⭐⭐⭐ | Full-stack apps |
| **Netlify** | ✅ Yes | ⭐⭐ | Frontend only (needs workarounds) |
| **Vercel** | ✅ Yes | ⭐⭐⭐ | Requires serverless functions |

## Recommended: Railway

Railway is the easiest for your setup because:
- ✅ Auto-detects Node.js apps
- ✅ Free MongoDB included
- ✅ Simple one-click deployment
- ✅ Custom domains included
- ✅ HTTPS automatic
- ✅ Easy environment variable management

## After Deployment Checklist

- [ ] Deploy to Railway or Render
- [ ] MongoDB connected and working
- [ ] Frontend loads at root URL
- [ ] API endpoints work (`/api/health`, `/api/transactions`, etc.)
- [ ] All pages load (`/budgeting.html`, `/activity.html`, `/rewards.html`)
- [ ] Update `API_BASE_URL` if needed (or use relative URLs)
- [ ] Test custom domain (optional)
- [ ] Import initial data using scripts

## Need Help?

- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs
- Your app is ready - just pick a platform and deploy! 🚀

