// API Configuration for Netlify Deployment
// This file is loaded before script.js to set the backend API URL
// 
// IMPORTANT: Update this with your backend URL!
// If deploying backend on Railway: https://your-app.up.railway.app/api
// If deploying backend on Render: https://your-app.onrender.com/api

window.APP_CONFIG = {
    // Replace this with your actual backend URL
    API_BASE_URL: 'https://your-backend.railway.app/api'
    
    // Examples:
    // Railway: 'https://smart-campus-wallet-backend.up.railway.app/api'
    // Render: 'https://smart-campus-wallet-backend.onrender.com/api'
    
    // To find your backend URL:
    // 1. Deploy backend to Railway or Render
    // 2. Copy the URL (e.g., https://my-app.up.railway.app)
    // 3. Add '/api' to the end
    // 4. Paste it above as: API_BASE_URL: 'https://my-app.up.railway.app/api'
};

