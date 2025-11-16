# Environment Variables Required for Railway

## Summary

**You only need 1 required variable:**
- ✅ `MONGODB_URI` - **REQUIRED**

**Optional (but recommended):**
- ⚙️ `NODE_ENV=production` - Optional but recommended

**Auto-set by Railway:**
- 🔄 `PORT` - Railway sets this automatically (don't set manually)

---

## Required Variables (1)

### 1. MONGODB_URI ✅ REQUIRED

**What it does:** Connects your app to MongoDB database

**How to get it:**
- **If using Railway MongoDB:**
  1. Go to your MongoDB service in Railway
  2. Click "Variables" tab
  3. Copy the `MONGO_URL` value
  4. Paste it as `MONGODB_URI` in your Web Service

- **If using MongoDB Atlas:**
  1. Get connection string from Atlas
  2. Format: `mongodb+srv://username:password@cluster.mongodb.net/database`
  3. Replace `<password>` with your actual password

**Where to set it:**
- Railway Dashboard → Your Web Service → Variables → "+ New Variable"
- **Name:** `MONGODB_URI`
- **Value:** Your MongoDB connection string

**Example:**
```
MONGODB_URI=mongodb://mongo.railway.internal:27017
```
or
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-campus-wallet
```

---

## Optional Variables

### 2. NODE_ENV ⚙️ OPTIONAL (Recommended)

**What it does:** Sets environment to production (hides error stack traces)

**Value:**
```
NODE_ENV=production
```

**Should you set it?**
- ✅ Yes, recommended for production
- Makes error messages cleaner (no stack traces shown to users)
- Helps with performance optimizations

**How to set:**
- Railway Dashboard → Web Service → Variables
- Name: `NODE_ENV`
- Value: `production`

---

## Auto-Set by Railway (Don't Set These)

### PORT 🔄 Auto-Set

Railway automatically sets `PORT` - you don't need to set it manually.

The server code already handles this:
```javascript
const PORT = process.env.PORT || 3000;
```

Railway will set `PORT` automatically, so don't add it as a variable.

---

## Complete Setup Checklist

For your **Web Service** in Railway, set these variables:

### Minimum Setup (Required):
- [ ] `MONGODB_URI` = Your MongoDB connection string

### Recommended Setup (Best Practice):
- [ ] `MONGODB_URI` = Your MongoDB connection string
- [ ] `NODE_ENV` = `production`

### That's it! Just 1-2 variables total.

---

## Visual Guide

```
Railway Dashboard
├── Your Project
    ├── MongoDB Service (if using Railway MongoDB)
    │   └── Variables Tab
    │       └── MONGO_URL ← Copy this value
    │
    └── Web Service (Node.js App)
        └── Variables Tab
            ├── MONGODB_URI = [paste MONGO_URL here] ✅ REQUIRED
            └── NODE_ENV = production ⚙️ OPTIONAL
```

---

## Common Mistakes

❌ **Don't set:** `PORT` (Railway sets this automatically)
❌ **Don't set:** `MONGO_URL` in web service (that's for MongoDB service only)
✅ **Do set:** `MONGODB_URI` in web service (copy value from MongoDB service)

---

## Summary

**Answer: You only need 1 variable minimum:**
1. ✅ `MONGODB_URI` - Required

**Plus 1 optional:**
2. ⚙️ `NODE_ENV=production` - Recommended

**Total: 1-2 variables depending on your preference**

That's it! 🎉

