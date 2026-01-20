#!/bin/bash

# Exit on error
set -e

echo "Starting PrismaEdu Installation..."

# 1. Update system and install dependencies
echo "Updating system and installing base dependencies..."
sudo apt-get update
sudo apt-get install -y curl git unzip build-essential python3

# 2. Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed."
    node -v
fi

# 3. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

# 4. Install project dependencies
echo "Installing project dependencies..."
npm install

# 5. Build the project
echo "Building the project..."
npm run build

# 6. Initialize Database (only if not exists)
if [ ! -f "database.sqlite" ]; then
    echo "Initializing database..."
    npm run reset
else
    echo "Database already exists. Skipping initialization."
fi

# 7. Start application with PM2
echo "Starting application with PM2..."
pm2 delete prismaedu 2>/dev/null || true
pm2 start server/index.js --name "prismaedu"
pm2 save

echo "Installation complete! PrismaEdu is running on port 3020."
