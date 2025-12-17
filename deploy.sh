#!/bin/bash

# Configuration
APP_DIR="/var/www/escort-de"
BRANCH="main"
PM2_APP_NAME="escort-de"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

# Navigate to app directory
cd "$APP_DIR" || exit 1

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# Check if pull was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Git pull failed!${NC}"
    exit 1
fi

# Install/update dependencies (including devDependencies for build)
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Restart application with PM2
echo -e "${YELLOW}Restarting application...${NC}"
if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME"
else
    pm2 start server.js --name "$PM2_APP_NAME" --env production
fi

# Save PM2 process list
pm2 save

echo -e "${GREEN}Deployment completed successfully!${NC}"
pm2 list

