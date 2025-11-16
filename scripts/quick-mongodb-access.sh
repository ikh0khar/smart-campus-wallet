#!/bin/bash

# Quick MongoDB Access Script
# This script helps you quickly access and query your MongoDB database

export PATH="/opt/homebrew/bin:$PATH"

echo "🔌 MongoDB Quick Access"
echo "======================"
echo ""
echo "Your database: smart-campus-wallet"
echo "Connection: mongodb://localhost:27017/smart-campus-wallet"
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running."
    echo "   Start it with: brew services start mongodb-community"
    echo ""
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Function to show quick stats
show_stats() {
    mongosh mongodb://localhost:27017/smart-campus-wallet --quiet --eval "
    print('📊 Database Statistics:');
    print('======================');
    print('Transactions: ' + db.transactions.countDocuments());
    print('Budgets: ' + db.budgets.countDocuments());
    print('Users: ' + db.users.countDocuments());
    print('');
    "
}

# Function to open MongoDB shell
open_shell() {
    echo "🚀 Opening MongoDB shell..."
    echo "   Type 'exit' to quit"
    echo ""
    mongosh mongodb://localhost:27017/smart-campus-wallet
}

# Menu
echo "Choose an option:"
echo "1) Open MongoDB shell"
echo "2) Show database statistics"
echo "3) View sample transactions"
echo "4) View budgets"
echo "5) View users"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        open_shell
        ;;
    2)
        show_stats
        ;;
    3)
        mongosh mongodb://localhost:27017/smart-campus-wallet --quiet --eval "db.transactions.find().limit(5).pretty()"
        ;;
    4)
        mongosh mongodb://localhost:27017/smart-campus-wallet --quiet --eval "db.budgets.find().pretty()"
        ;;
    5)
        mongosh mongodb://localhost:27017/smart-campus-wallet --quiet --eval "db.users.find().pretty()"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

