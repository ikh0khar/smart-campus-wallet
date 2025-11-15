#!/bin/bash
echo "Enter your MongoDB Atlas connection string:"
echo "Example: mongodb+srv://username:password@cluster.mongodb.net/smart-campus-wallet"
read -p "MONGODB_URI: " mongo_uri
echo "MONGODB_URI=$mongo_uri" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env
echo ""
echo "✅ .env file updated!"
echo ""
echo "To test connection, run:"
echo "  npm install"
echo "  node scripts/test-connection.js"
