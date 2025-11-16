# Netlify Deployment Guide - Complete Setup

This guide will help you deploy your frontend to Netlify while keeping the backend (with MongoDB) on Railway.

## Architecture

```
Frontend (Netlify) → Static files (HTML/CSS/JS)
    ↓ API calls (fetch)
Backend (Railway) → Express.js server
    ↓ Database queries
MongoDB (Railway or Atlas) → Database
```

## Prerequisites

1. ✅ Backend deployed on Railway (or Render)
2. ✅ MongoDB connected to backend
3. ✅ Backend URL ready (e.g., `https://your-app.up.railway.app`)

## Step 1: Configure Backend API URL

### Update `public/config.js`:

```javascript
window.APP_CONFIG = {
    // Replace with your actual backend URL
    API_BASE_URL: 'https://your-backend.railway.app/api'
};
```

**Important:** 
- Include `/api` at the end
- Use HTTPS (not HTTP)
- No trailing slash after `/api`

**Examples:**
- Railway: `https://smart-campus-wallet-backend.up.railway.app/api`
- Render: `https://smart-campus-wallet-backend.onrender.com/api`

## Step 2: Configure Backend CORS

Your backend needs to allow requests from Netlify.

### In Railway Backend → Variables:
Add environment variable:
```
FRONTEND_URL = https://your-site.netlify.app
```

Or if you don't know your Netlify URL yet, temporarily use:
```
FRONTEND_URL = *
```

**Note:** The backend CORS is already configured to use `FRONTEND_URL` environment variable.

## Step 3: Deploy Frontend to Netlify

### Method 1: Deploy from GitHub (Recommended)

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Sign up/login

2. **Add New Site:**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access GitHub

3. **Select Repository:**
   - Choose: `ikh0khar/smart-campus-wallet`
   - Select branch: `main-v2`

4. **Configure Build Settings:**
   - **Build command:** (leave empty - no build needed)
   - **Publish directory:** `public`
   - **Base directory:** (leave empty)

5. **Environment Variables (Optional):**
   - Site settings → Environment variables
   - You can add `API_BACKEND_URL` here if you prefer, but `config.js` works better

6. **Deploy:**
   - Click "Deploy site"
   - Wait for deployment (~1 minute)

7. **Get Your Frontend URL:**
   - Netlify gives you: `https://random-name-123.netlify.app`
   - Copy this URL

### Method 2: Drag & Drop (Quick Test)

1. **Prepare Files:**
   - Make sure `public/config.js` has your backend URL set
   - Zip the `public/` folder

2. **Deploy:**
   - Go to Netlify → Add new site → "Deploy manually"
   - Drag and drop the `public/` folder or zip file

## Step 4: Update Backend CORS with Netlify URL

After deploying to Netlify:

1. **Get your Netlify URL:**
   - Netlify dashboard → Your site → Overview
   - URL: `https://your-site.netlify.app`

2. **Update Backend CORS:**
   - Go to Railway → Your backend service
   - Variables tab → Edit `FRONTEND_URL`
   - Set to: `https://your-site.netlify.app`
   - Save (auto-redeploys)

## Step 5: Test Everything

### Test Backend:
```bash
curl https://your-backend.railway.app/api/health
```
Should return: `{"status":"OK",...}`

### Test Frontend:
1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Open browser console (F12)
3. Check for errors
4. Test API calls - should go to your backend

### Test API Connection:
1. Go to: `https://your-site.netlify.app/budgeting.html`
2. Open browser console (F12)
3. Should see API calls to: `https://your-backend.railway.app/api/transactions`
4. Data should load (if MongoDB has data)

## Step 6: Custom Domain (Optional)

### In Netlify:
1. Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain
4. Follow DNS setup instructions

### Update Backend CORS:
After setting custom domain, update `FRONTEND_URL` in Railway to your custom domain.

## Troubleshooting

### Issue: CORS Error in Browser Console

**Error:** 
```
Access to fetch at 'https://backend...' from origin 'https://frontend...' 
has been blocked by CORS policy
```

**Fix:**
1. Check `FRONTEND_URL` is set in Railway backend
2. Make sure it matches your Netlify URL exactly
3. Redeploy backend after changing `FRONTEND_URL`

### Issue: API Calls Go to Wrong URL

**Symptom:** Requests go to `netlify.app/api` instead of `railway.app/api`

**Fix:**
1. Check `public/config.js` has correct backend URL
2. Make sure `config.js` loads before `script.js` in HTML
3. Clear browser cache and reload

### Issue: No Data Loading

**Check:**
1. Backend is running (test `/api/health`)
2. MongoDB is connected (test `/api/diagnostic`)
3. Data is imported (check MongoDB collections)
4. Network tab shows API calls to backend (not frontend)

### Issue: 404 on API Calls

**Fix:**
1. Verify backend URL in `config.js` is correct
2. Make sure URL ends with `/api`
3. Test backend URL directly in browser: `https://backend.railway.app/api/health`

## Configuration Files Summary

### `public/config.js` (Frontend - Netlify)
```javascript
window.APP_CONFIG = {
    API_BASE_URL: 'https://your-backend.railway.app/api'
};
```
**Update this** with your backend URL before deploying.

### Railway Environment Variables (Backend)
```
MONGODB_URI = mongodb://... (your MongoDB connection string)
FRONTEND_URL = https://your-site.netlify.app (your Netlify URL)
NODE_ENV = production
```

## File Structure for Netlify

```
public/                    ← Netlify serves from here
├── index.html
├── budgeting.html
├── activity.html
├── rewards.html
├── config.js              ← BACKEND URL CONFIGURED HERE
├── script.js              ← Uses config.js for API URL
├── styles.css
└── assets/
```

## Quick Checklist

- [ ] Backend deployed on Railway
- [ ] MongoDB connected to backend
- [ ] Backend URL copied (e.g., `https://app.up.railway.app`)
- [ ] `public/config.js` updated with backend URL + `/api`
- [ ] Frontend deployed to Netlify
- [ ] Netlify URL copied (e.g., `https://site.netlify.app`)
- [ ] `FRONTEND_URL` set in Railway backend
- [ ] Test backend health: `/api/health`
- [ ] Test frontend loads
- [ ] Test API calls work from frontend
- [ ] Data loads on frontend

## Advantages of This Setup

✅ **CDN for Frontend:** Netlify serves static files globally (fast!)
✅ **Separate Scaling:** Scale frontend and backend independently
✅ **Free Tiers:** Both Netlify and Railway have free tiers
✅ **Easy Updates:** Update frontend without touching backend
✅ **MongoDB Works:** Backend on Railway can connect to MongoDB

## Next Steps After Deployment

1. **Import Data to MongoDB:**
   ```bash
   # Connect to Railway backend or run locally pointing to production MongoDB
   npm run import data/wallet_transactions_sample.csv
   npm run seed:budgets
   npm run seed:events
   ```

2. **Monitor:**
   - Netlify: Check deploy logs
   - Railway: Check deployment logs and MongoDB connection

3. **Custom Domain:**
   - Set up custom domain in Netlify
   - Update `FRONTEND_URL` in Railway

---

**You're ready to deploy to Netlify! Just update `public/config.js` with your backend URL and deploy!** 🚀

