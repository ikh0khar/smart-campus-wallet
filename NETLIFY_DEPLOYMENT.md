# Netlify Deployment Guide

## Important: Full-Stack App Architecture

This app has **two parts**:
1. **Frontend** (HTML/CSS/JS in `public/` folder) - Can be deployed to Netlify
2. **Backend** (Express.js API in `server.js`) - Needs separate hosting

## Option 1: Deploy Frontend to Netlify + Backend Separately (Recommended)

### Frontend Deployment (Netlify)

1. **Connect Repository to Netlify:**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Select branch: `main-v2`

2. **Build Settings:**
   - **Build command:** Leave empty (no build needed)
   - **Publish directory:** `public`
   - **Base directory:** Leave empty

3. **Environment Variables:**
   - You may need to set `NODE_VERSION` if Netlify requires it
   - Frontend doesn't need MongoDB connection (that's backend)

4. **Deploy!**
   - Click "Deploy site"
   - Netlify will deploy your frontend

### Backend Deployment (Choose one):

#### A. Railway (Easy & Free)
1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository and branch (`main-v2`)
4. Set environment variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/smart-campus-wallet
   PORT=3000
   ```
5. Add MongoDB service or use MongoDB Atlas
6. Deploy!

#### B. Render (Free tier available)
1. Go to [Render](https://render.com/)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add environment variables
6. Deploy!

#### C. MongoDB Atlas (Free MongoDB hosting)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in backend environment variables

### Update Frontend API URL

After deploying backend, update the API URL in `public/script.js`:

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:3000/api';

// To your backend URL:
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
// or
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
```

## Option 2: Deploy Everything to Netlify (Serverless Functions)

This requires converting Express routes to Netlify Functions. More complex but keeps everything in one place.

### Steps:

1. Convert API routes to Netlify Functions
2. Deploy backend as serverless functions
3. Deploy frontend as static site

See Netlify Functions documentation for more details.

## Custom Domain Setup

1. **In Netlify Dashboard:**
   - Go to your site → "Domain settings"
   - Click "Add custom domain"
   - Enter your domain
   - Follow DNS configuration instructions

2. **For Backend (Railway/Render):**
   - These services also allow custom domains
   - Configure in their respective dashboards

## Troubleshooting

### "Page not found" errors:
- ✅ Ensure `netlify.toml` is in root
- ✅ Ensure `public/_redirects` file exists
- ✅ Check that publish directory is set to `public`

### API calls failing:
- ✅ Verify backend is deployed and accessible
- ✅ Update `API_BASE_URL` in `public/script.js`
- ✅ Check CORS settings in `server.js` (should allow your Netlify domain)

### Environment Variables:
- Frontend: Usually not needed for static files
- Backend: Must include `MONGODB_URI` and `PORT`

## Quick Deploy Checklist

- [ ] Frontend files in `public/` folder
- [ ] `netlify.toml` in root
- [ ] `public/_redirects` file exists
- [ ] Backend deployed separately (Railway/Render)
- [ ] `API_BASE_URL` updated in `public/script.js`
- [ ] MongoDB connection configured
- [ ] CORS allows Netlify domain

## Need Help?

- Netlify Docs: https://docs.netlify.com/
- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs

