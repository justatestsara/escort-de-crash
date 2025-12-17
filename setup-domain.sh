#!/bin/bash

# Domain Setup Script for Escort.de
# This script updates Nginx configuration for your domain

echo "=========================================="
echo "Domain Setup for Escort.de"
echo "=========================================="
echo ""

# Get domain name from user
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "Error: Domain name cannot be empty!"
    exit 1
fi

echo ""
echo "Setting up domain: $DOMAIN_NAME"
echo ""

# Backup existing config
if [ -f /etc/nginx/sites-available/escort-de ]; then
    echo "Backing up existing Nginx configuration..."
    sudo cp /etc/nginx/sites-available/escort-de /etc/nginx/sites-available/escort-de.backup
fi

# Create/Update Nginx configuration
echo "Creating Nginx configuration for $DOMAIN_NAME..."
sudo tee /etc/nginx/sites-available/escort-de > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Increase body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
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
    echo "Domain setup completed!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Add DNS A record in your domain registrar:"
    echo "   Type: A"
    echo "   Name: @ (or blank)"
    echo "   Value: 94.154.172.248"
    echo ""
    echo "2. Add DNS A record for www subdomain:"
    echo "   Type: A"
    echo "   Name: www"
    echo "   Value: 94.154.172.248"
    echo ""
    echo "3. Wait for DNS propagation (5 minutes to 48 hours)"
    echo ""
    echo "4. Test DNS:"
    echo "   dig ${DOMAIN_NAME}"
    echo "   Should return: 94.154.172.248"
    echo ""
    echo "5. Once DNS propagates, access your site at:"
    echo "   http://${DOMAIN_NAME}"
    echo "   http://www.${DOMAIN_NAME}"
    echo ""
    echo "6. (Optional) Set up SSL/HTTPS:"
    echo "   sudo apt install certbot python3-certbot-nginx -y"
    echo "   sudo certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
    echo ""
else
    echo "Nginx configuration test failed!"
    echo "Restoring backup..."
    if [ -f /etc/nginx/sites-available/escort-de.backup ]; then
        sudo cp /etc/nginx/sites-available/escort-de.backup /etc/nginx/sites-available/escort-de
    fi
    exit 1
fi

