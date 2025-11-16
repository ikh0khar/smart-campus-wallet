# Installation Guide - Node.js and npm

## Current Status

✅ **Node.js is already installed**: v25.2.0
✅ **npm is already installed**: v11.6.2
✅ **Dependencies installed**: All packages installed via `npm install`

## How to Install Node.js and npm (If Needed)

### Option 1: Using Homebrew (macOS - Recommended)

**Node.js comes with npm automatically!**

```bash
# Install Node.js (includes npm)
brew install node

# Verify installation
node --version
npm --version
```

### Option 2: Official Installer

1. Download from: https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Follow the installation wizard
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Option 3: Using nvm (Node Version Manager)

**Recommended if you need multiple Node.js versions:**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.zshrc

# Install latest LTS Node.js
nvm install --lts

# Use the installed version
nvm use --lts

# Verify
node --version
npm --version
```

## Installing Project Dependencies

Once Node.js and npm are installed, install project dependencies:

```bash
# Navigate to project directory
cd /Users/veerpatel/Hackfest2025/smart-campus-wallet

# Install all dependencies from package.json
npm install
```

This will install:
- `express` - Web framework
- `cors` - CORS middleware
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `nodemon` - Development auto-reload (dev dependency)

## Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if dependencies are installed
ls node_modules | grep express
ls node_modules | grep cors
ls node_modules | grep mongoose

# Or test importing
node -e "console.log('Express:', require('express').version || 'installed');"
node -e "console.log('Mongoose:', require('mongoose').version);"
```

## Troubleshooting

### Node.js/npm not found in PATH

If `node` or `npm` commands don't work:

```bash
# For Homebrew installations (Apple Silicon)
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Intel Mac installations
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Errors

If you get permission errors with npm:

```bash
# Fix npm permissions (don't use sudo)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Reinstall Dependencies

If dependencies are missing or corrupted:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Quick Start After Installation

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Test MongoDB connection
npm run test:connection

# 3. Start the server
npm run dev

# 4. Test the API (in another terminal)
npm run test:api
```

## Current Installation Status

- ✅ Node.js: v25.2.0 installed
- ✅ npm: v11.6.2 installed
- ✅ Dependencies: All installed via `npm install`

You're all set! 🎉

