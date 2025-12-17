#!/bin/bash

# Configuration - UPDATE THESE VALUES
APP_DIR="/var/www/escort-de"
REPO_URL="https://github.com/justatestsara/esc.git"
BRANCH="main"
NODE_VERSION="18"
PM2_APP_NAME="escort-de"
PORT="3000"
DOMAIN="yourdomain.com"  # Change to your domain

echo "Setting up Next.js application on VPS..."

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js using NVM
echo "Installing Node.js..."
if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install Git if not installed
echo "Installing Git..."
sudo apt install git -y

# Create app directory
echo "Creating application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$USER "$APP_DIR"

# Clone repository
echo "Cloning repository..."
cd "$APP_DIR"
git clone "$REPO_URL" .

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build application
echo "Building application..."
npm run build

# Start application with PM2
echo "Starting application with PM2..."
pm2 start server.js --name "$PM2_APP_NAME" --env production
pm2 save

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup
echo "Run the command shown above to enable PM2 on boot"

# Setup Nginx reverse proxy (optional)
read -p "Do you want to set up Nginx reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up Nginx reverse proxy..."
    sudo apt install nginx -y

    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
fi

echo "Setup completed!"
echo "Your application should be running at http://localhost:$PORT"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "And accessible via http://$DOMAIN"
fi

