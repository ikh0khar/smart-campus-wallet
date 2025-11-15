# Manual MongoDB Installation Guide (macOS)

If you prefer to install MongoDB manually without Homebrew, follow these steps:

## Option 1: MongoDB via Homebrew (Recommended)

Run the installation script:
```bash
./scripts/install-mongodb.sh
```

## Option 2: Manual Download

1. **Download MongoDB Community Edition**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: macOS, Package: .tgz or .pkg
   - Download and install

2. **Create MongoDB data directory**
   ```bash
   sudo mkdir -p /data/db
   sudo chown $(whoami) /data/db
   ```

3. **Add MongoDB to PATH**
   - Add MongoDB bin directory to your PATH in `~/.zshrc` or `~/.bash_profile`
   - Example: `export PATH="/usr/local/mongodb/bin:$PATH"`

4. **Start MongoDB**
   ```bash
   mongod --dbpath /data/db
   ```
   Or run as a service (if installed via .pkg)

## Option 3: MongoDB via Docker

If you have Docker installed:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then update `.env`:
```
MONGODB_URI=mongodb://localhost:27017/smart-campus-wallet
```

## Verify Installation

After installation, verify MongoDB is running:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Or test connection
node scripts/test-connection.js
```

