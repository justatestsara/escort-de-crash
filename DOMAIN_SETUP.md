# Domain Setup Guide for Escort.de

## Step 1: DNS Configuration

In your domain registrar's DNS settings, add these records:

### A Record (IPv4)
- **Type:** A
- **Name:** @ (or leave blank, or use your root domain)
- **Value:** 94.154.172.248
- **TTL:** 3600 (or default)

### A Record for www subdomain (optional but recommended)
- **Type:** A
- **Name:** www
- **Value:** 94.154.172.248
- **TTL:** 3600 (or default)

### Example DNS Records:
```
Type    Name    Value           TTL
A       @       94.154.172.248 3600
A       www     94.154.172.248 3600
```

**Where to add these:**
- Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
- Find DNS Management / DNS Settings
- Add the A records above
- Wait for DNS propagation (can take 5 minutes to 48 hours, usually 15-30 minutes)

## Step 2: Update Nginx Configuration

### Option A: Update existing config

```bash
sudo nano /etc/nginx/sites-available/escort-de
```

Change this line:
```nginx
server_name 94.154.172.248 _;
```

To:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

Replace `yourdomain.com` with your actual domain name.

### Option B: Use the setup script with domain

Run the setup script and it will prompt for domain name, or manually edit the config.

## Step 3: Test and Restart Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx
```

## Step 4: Verify DNS Propagation

Check if DNS is working:
```bash
# Check A record
dig yourdomain.com
# or
nslookup yourdomain.com

# Should return: 94.154.172.248
```

## Step 5: Access Your Site

Once DNS propagates, access your site at:
- http://yourdomain.com
- http://www.yourdomain.com

## Step 6: Set Up SSL/HTTPS (Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

After SSL setup, your site will be accessible at:
- https://yourdomain.com
- https://www.yourdomain.com

### Auto-renewal (already set up by Certbot)
```bash
# Test renewal
sudo certbot renew --dry-run
```

## Complete Nginx Configuration Example

After domain setup, your `/etc/nginx/sites-available/escort-de` should look like:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Or serve HTTP directly (before SSL setup)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        client_max_body_size 50M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Troubleshooting

### DNS not working?
1. Check DNS propagation: https://www.whatsmydns.net/
2. Verify A record is correct
3. Wait longer (up to 48 hours for full propagation)

### Site not loading?
1. Check Nginx: `sudo systemctl status nginx`
2. Check app: `pm2 list`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Test config: `sudo nginx -t`

### SSL certificate issues?
1. Make sure DNS is pointing to your IP
2. Make sure port 80 and 443 are open in firewall
3. Check: `sudo certbot certificates`

