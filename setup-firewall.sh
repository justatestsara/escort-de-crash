#!/bin/bash

# Firewall Setup Script
# This script configures UFW firewall for the web server

echo "Setting up firewall..."

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo "Installing UFW..."
    apt update
    apt install ufw -y
fi

# Allow SSH (important - don't lock yourself out!)
echo "Allowing SSH..."
ufw allow 22/tcp

# Allow HTTP
echo "Allowing HTTP (port 80)..."
ufw allow 80/tcp

# Allow HTTPS
echo "Allowing HTTPS (port 443)..."
ufw allow 443/tcp

# Allow the Node.js app port (optional, if you want direct access)
echo "Allowing Node.js app port (3000)..."
ufw allow 3000/tcp

# Enable firewall
echo "Enabling firewall..."
ufw --force enable

# Show status
echo ""
echo "Firewall status:"
ufw status

echo ""
echo "Firewall configured successfully!"

