#!/bin/bash

echo "🚀 Installing MongoDB Community Edition on macOS"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed."
    echo ""
    echo "📦 Installing Homebrew first..."
    echo "   This will prompt you for your password."
    echo ""
    read -p "Press Enter to install Homebrew, or Ctrl+C to cancel..."
    
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH (for Apple Silicon Macs)
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

echo ""
echo "✅ Homebrew installed/verified"
echo ""

# Tap MongoDB Homebrew repository
echo "📦 Adding MongoDB Homebrew tap..."
brew tap mongodb/brew

# Install MongoDB Community Edition
echo "📦 Installing MongoDB Community Edition..."
brew install mongodb-community

# Start MongoDB service
echo ""
echo "🚀 Starting MongoDB service..."
brew services start mongodb-community

echo ""
echo "✅ MongoDB installed and started!"
echo ""
echo "📝 Next steps:"
echo "   1. Test connection: node scripts/test-connection.js"
echo "   2. Import data: node scripts/import-csv.js data/wallet_transactions_sample.csv --clear"
echo ""
echo "💡 Useful commands:"
echo "   - Stop MongoDB: brew services stop mongodb-community"
echo "   - Start MongoDB: brew services start mongodb-community"
echo "   - Check status: brew services list | grep mongodb"
echo ""

