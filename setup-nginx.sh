#!/bin/bash

# Nginx Setup Script for Escort.de
# This script sets up Nginx as a reverse proxy

VPS_IP="94.154.172.248"
APP_PORT="3000"

echo "Setting up Nginx reverse proxy..."

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install nginx -y
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/escort-de > /dev/null << EOF
server {
    listen 80;
    server_name ${VPS_IP} _;

    # Increase body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/escort-de /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo ""
    echo "=========================================="
    echo "Nginx setup completed!"
    echo "=========================================="
    echo ""
    echo "Your site should now be accessible at:"
    echo "http://${VPS_IP}"
    echo ""
    echo "Make sure:"
    echo "1. Your app is running: pm2 list"
    echo "2. Firewall allows port 80: ufw allow 80/tcp"
    echo "3. Firewall allows port 443 (for HTTPS): ufw allow 443/tcp"
else
    echo "Nginx configuration test failed!"
    exit 1
fi

