# How Separated Backend/Frontend Works - Explained

## Visual Flow

```
User's Browser
    ↓
    Visits: https://your-frontend.netlify.app
    ↓
    Loads HTML/CSS/JavaScript from Netlify
    ↓
    JavaScript runs in browser
    ↓
    Makes API call: fetch('https://your-backend.railway.app/api/transactions')
    ↓
    Browser sends HTTP request to Railway backend
    ↓
    Railway backend receives request
    ↓
    Backend queries MongoDB
    ↓
    Backend sends JSON response back
    ↓
    Browser receives response
    ↓
    JavaScript updates the page with data
```

## Step-by-Step Example

### Scenario: User wants to see their transactions

**Step 1: User visits frontend**
```
User types: https://smart-campus-wallet.netlify.app/budgeting.html
```
- Browser requests HTML/CSS/JS files from Netlify
- Netlify serves static files from your `public/` folder
- Page loads in browser

**Step 2: JavaScript runs**
```javascript
// When page loads, script.js runs:
async function loadBudgetingData() {
    // This code is running in the user's browser
    
    // API call goes to backend (different domain)
    const response = await fetch('https://backend-app.railway.app/api/transactions');
    const data = await response.json();
    
    // Update page with data
    displayTransactions(data);
}
```

**Step 3: Browser makes API request**
```
Browser sends HTTP request:
GET https://backend-app.railway.app/api/transactions
Headers:
  Origin: https://smart-campus-wallet.netlify.app
  Accept: application/json
```

**Step 4: Backend receives request**
```
Railway receives request at: https://backend-app.railway.app/api/transactions
```

**Step 5: Backend checks CORS**
```javascript
// In server.js, CORS middleware checks:
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // https://smart-campus-wallet.netlify.app
  ...
}));

// If origin matches, allows request
// Adds header: Access-Control-Allow-Origin: https://smart-campus-wallet.netlify.app
```

**Step 6: Backend processes request**
```javascript
// routes/transactions.js
router.get('/', async (req, res) => {
    // Query MongoDB
    const transactions = await Transaction.find().lean();
    
    // Send JSON response
    res.json({
        success: true,
        data: transactions
    });
});
```

**Step 7: Backend sends response**
```
HTTP Response:
Status: 200 OK
Headers:
  Access-Control-Allow-Origin: https://smart-campus-wallet.netlify.app
  Content-Type: application/json
Body:
{
  "success": true,
  "data": [...transactions...]
}
```

**Step 8: Browser receives response**
```javascript
// In browser, fetch() receives response
const data = await response.json();
// data = { success: true, data: [...] }

// JavaScript updates the page
displayTransactions(data.data);
```

**Step 9: User sees data**
- Page updates with transaction list
- User sees their spending data

## Key Concepts

### 1. CORS (Cross-Origin Resource Sharing)

**What is it?**
- Browser security feature
- Blocks requests between different domains (frontend on netlify.app, backend on railway.app)
- Backend must explicitly allow frontend domain

**How it works:**
```
Frontend (netlify.app) → Request → Backend (railway.app)
                                              ↓
                                    Check CORS headers
                                              ↓
                              If allowed, process request
                                              ↓
                                    Send response with
                                 Access-Control-Allow-Origin
                                              ↓
Frontend receives response ✅
```

**If CORS not configured:**
```
Browser: "Blocked! Different origin!"
Error: Access to fetch at 'https://backend...' from origin 'https://frontend...' 
has been blocked by CORS policy
```

### 2. API Base URL Configuration

**Same Domain (Current Setup):**
```javascript
// Frontend and backend on same domain
https://app.railway.app/          // Frontend (HTML)
https://app.railway.app/api/...   // Backend (API)

// Script uses relative URL:
const API_BASE_URL = window.location.origin + '/api';
// Results in: https://app.railway.app/api
```

**Separate Domains:**
```javascript
// Frontend on Netlify
https://app.netlify.app

// Backend on Railway
https://backend.railway.app

// Script needs absolute URL:
const API_BASE_URL = 'https://backend.railway.app/api';
// Or from config:
const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
```

### 3. Environment Variables

**Frontend (Netlify/Vercel):**
```
Set in platform dashboard:
VITE_API_URL = https://backend.railway.app/api

JavaScript can access:
process.env.VITE_API_URL
```

**Backend (Railway/Render):**
```
Set in platform dashboard:
FRONTEND_URL = https://app.netlify.app
MONGODB_URI = mongodb://...

Server.js uses:
process.env.FRONTEND_URL
process.env.MONGODB_URI
```

## Real-World Example Flow

### User clicks "View Budgets" button

**1. User Action:**
```
User clicks button on: https://wallet.netlify.app/budgeting.html
```

**2. JavaScript Handler:**
```javascript
// This runs in user's browser
function loadBudgets() {
    fetch('https://api-wallet.railway.app/api/budgets?userId=user123')
        .then(response => response.json())
        .then(data => {
            // Display budgets on page
            showBudgets(data.data);
        });
}
```

**3. Network Request (Browser → Backend):**
```
GET https://api-wallet.railway.app/api/budgets?userId=user123
Host: api-wallet.railway.app
Origin: https://wallet.netlify.app
```

**4. Backend Processing:**
```
Railway receives request
  ↓
CORS middleware checks: Is https://wallet.netlify.app allowed? ✅
  ↓
Route handler: router.get('/api/budgets')
  ↓
Query MongoDB: Budget.find({ userId: 'user123' })
  ↓
Return JSON: { success: true, data: [...budgets...] }
```

**5. Response (Backend → Browser):**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://wallet.netlify.app
Content-Type: application/json

{
  "success": true,
  "data": [
    { "name": "Food Budget", "amount": 500, ... },
    { "name": "Transportation", "amount": 200, ... }
  ]
}
```

**6. Frontend Updates:**
```javascript
// Browser receives response
data = { success: true, data: [...] }

// JavaScript updates DOM
function showBudgets(budgets) {
    const container = document.getElementById('budgets-list');
    budgets.forEach(budget => {
        container.innerHTML += `
            <div class="budget-card">
                <h3>${budget.name}</h3>
                <p>$${budget.amount}</p>
            </div>
        `;
    });
}

// User sees budgets on page ✅
```

## Comparison: Same Domain vs Separate

### Same Domain (Current)
```
https://app.railway.app/
  ├── / (frontend - HTML/CSS/JS)
  ├── /budgeting.html (frontend)
  ├── /activity.html (frontend)
  └── /api/ (backend - API endpoints)
      ├── /api/transactions
      ├── /api/budgets
      └── /api/activities

Advantages:
✅ Simple setup (one deployment)
✅ No CORS needed
✅ Same domain = easier cookies/auth

Disadvantages:
❌ Frontend and backend scale together
❌ Can't use CDN for frontend
❌ Must deploy both together
```

### Separate Domains (Proposed)
```
Frontend: https://wallet.netlify.app
  ├── / (served by Netlify CDN)
  ├── /budgeting.html
  └── /activity.html
       ↓ (API calls)
Backend: https://api.railway.app
  └── /api/
      ├── /api/transactions
      ├── /api/budgets
      └── /api/activities

Advantages:
✅ CDN for frontend (faster globally)
✅ Scale independently
✅ Free tier for static frontend
✅ Deploy separately

Disadvantages:
❌ Need CORS configuration
❌ Two deployments to manage
❌ Must configure API URL
```

## Complete Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ USER'S BROWSER                                               │
│                                                              │
│ 1. User visits: https://wallet.netlify.app                  │
│ 2. Browser loads HTML/CSS/JS from Netlify                   │
│ 3. JavaScript executes: loadBudgetingData()                 │
│ 4. Makes fetch() call to backend                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP Request
                           │ GET /api/budgets
                           │ Origin: wallet.netlify.app
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ NETWORK (Internet)                                           │
│ Request travels from user's browser to Railway server       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RAILWAY BACKEND SERVER                                       │
│                                                              │
│ 1. Receives request at /api/budgets                         │
│ 2. CORS middleware checks origin                            │
│ 3. Allows request (wallet.netlify.app in allowed list)      │
│ 4. Route handler processes request                          │
│ 5. Queries MongoDB: Budget.find()                           │
│ 6. Formats response as JSON                                 │
│ 7. Sends response back                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP Response
                           │ Status: 200 OK
                           │ CORS Headers: ✅
                           │ Body: { "data": [...] }
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ NETWORK (Internet)                                           │
│ Response travels from Railway to user's browser             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ USER'S BROWSER                                               │
│                                                              │
│ 1. Receives JSON response                                   │
│ 2. JavaScript parses data                                   │
│ 3. Updates DOM with budgets                                 │
│ 4. User sees budgets on screen ✅                           │
└─────────────────────────────────────────────────────────────┘
```

## Why This Works

1. **Frontend is just files** - HTML/CSS/JS served by Netlify CDN
2. **Backend is an API** - Express server on Railway handling requests
3. **Browser connects them** - JavaScript in browser makes HTTP requests
4. **CORS allows it** - Backend says "yes, frontend can talk to me"
5. **JSON is universal** - Both sides speak JSON

## Testing It

### Test Backend Directly:
```bash
curl https://backend.railway.app/api/health
# Returns: {"status":"OK",...}
```

### Test from Frontend:
```javascript
// In browser console on frontend site
fetch('https://backend.railway.app/api/health')
    .then(r => r.json())
    .then(console.log)
// Should work if CORS is configured correctly
```

### If CORS Error:
```
Access-Control-Allow-Origin error
→ Backend needs FRONTEND_URL environment variable set
→ Or CORS configured to allow your frontend domain
```

---

**TL;DR:** Browser loads frontend from Netlify, JavaScript makes HTTP requests to Railway backend, backend responds with JSON, frontend displays it. CORS makes sure browser allows the cross-origin requests. 🚀

