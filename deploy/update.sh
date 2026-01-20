#!/bin/bash

# Exit on error
set -e

echo "Starting PrismaEdu Update..."

# 1. Pull latest changes
echo "Pulling latest changes from git..."
git pull

# 2. Install dependencies
echo "Installing dependencies..."
npm install

# 3. Rebuild
echo "Rebuilding project..."
npm run build

# 4. Restart PM2
echo "Restarting application..."
pm2 restart prismaedu

echo "Update complete!"
