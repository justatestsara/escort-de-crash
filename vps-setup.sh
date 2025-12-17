#!/bin/bash

# One-time VPS Setup Script for Escort.de
# Run this script once on your VPS to set up everything

set -e  # Exit on any error

# Configuration
APP_DIR="/var/www/escort-de"
REPO_URL="https://github.com/justatestsara/esc.git"
BRANCH="main"
NODE_VERSION="18"
PM2_APP_NAME="escort-de"
PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Escort.de VPS Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Note: Not running as root. Some commands may require sudo.${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
$SUDO apt update && $SUDO apt upgrade -y

# Step 2: Install Git
echo -e "${YELLOW}[2/8] Installing Git...${NC}"
$SUDO apt install git -y

# Step 3: Install Node.js using NVM
echo -e "${YELLOW}[3/8] Installing Node.js ${NODE_VERSION}...${NC}"
if [ -d "$HOME/.nvm" ]; then
    echo "NVM already installed, skipping..."
else
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

# Install and use Node.js
nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# Verify Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js installation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js $(node -v) installed successfully${NC}"

# Step 4: Install PM2
echo -e "${YELLOW}[4/8] Installing PM2...${NC}"
npm install -g pm2

# Step 5: Create app directory
echo -e "${YELLOW}[5/8] Creating application directory...${NC}"
$SUDO mkdir -p "$APP_DIR"
$SUDO chown -R $USER:$USER "$APP_DIR"

# Step 6: Clone repository
echo -e "${YELLOW}[6/8] Cloning repository from GitHub...${NC}"
cd "$APP_DIR"

if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest changes..."
    git pull origin $BRANCH
else
    git clone "$REPO_URL" .
fi

# Step 7: Install dependencies and build
echo -e "${YELLOW}[7/8] Installing dependencies and building application...${NC}"
npm install

# Build the application
echo "Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Step 8: Start application with PM2
echo -e "${YELLOW}[8/8] Starting application with PM2...${NC}"

# Make deploy script executable
chmod +x deploy.sh

# Check if app is already running
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "Application already running, restarting..."
    pm2 restart "$PM2_APP_NAME"
else
    pm2 start server.js --name "$PM2_APP_NAME" --env production
fi

# Save PM2 process list
pm2 save

# Setup PM2 startup
echo ""
echo -e "${YELLOW}Setting up PM2 startup script...${NC}"
STARTUP_CMD=$(pm2 startup | grep -oP 'sudo.*$')
if [ ! -z "$STARTUP_CMD" ]; then
    echo -e "${BLUE}Run this command to enable PM2 on boot:${NC}"
    echo -e "${GREEN}$STARTUP_CMD${NC}"
    echo ""
    read -p "Do you want to run it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval $STARTUP_CMD
    fi
fi

# Generate SSH key for GitHub Actions
echo ""
echo -e "${YELLOW}Generating SSH key for GitHub Actions deployment...${NC}"
if [ ! -f ~/.ssh/deploy_key ]; then
    ssh-keygen -t ed25519 -C "deploy@vps" -f ~/.ssh/deploy_key -N "" -q
    cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/deploy_key
    chmod 644 ~/.ssh/authorized_keys
    echo -e "${GREEN}SSH key generated successfully${NC}"
else
    echo "SSH key already exists, skipping..."
fi

# Display summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Completed Successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Application Status:${NC}"
pm2 list
echo ""
echo -e "${GREEN}Application is running on: http://localhost:${PORT}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. View logs: pm2 logs $PM2_APP_NAME"
echo "2. Monitor: pm2 monit"
echo "3. Restart: pm2 restart $PM2_APP_NAME"
echo ""
echo -e "${YELLOW}For GitHub Actions Auto-Deployment:${NC}"
echo "1. Copy this private key to GitHub Secrets (VPS_SSH_KEY):"
echo -e "${BLUE}"
cat ~/.ssh/deploy_key
echo -e "${NC}"
echo ""
echo "2. Add these GitHub Secrets:"
echo "   - VPS_HOST: 94.154.172.248"
echo "   - VPS_USERNAME: root"
echo "   - VPS_SSH_KEY: (the key shown above)"
echo "   - VPS_PORT: 22"
echo ""
echo -e "${GREEN}Setup complete! Your application should be running.${NC}"

