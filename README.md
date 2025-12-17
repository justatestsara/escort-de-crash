# Escort.de - Premium Escort Services Platform

A modern Next.js application for premium escort services with multi-language support (German/English) and dark/light theme.

## Features

- 🌍 Multi-language support (German/English)
- 🌓 Dark/Light theme toggle
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- 📝 Post ad functionality
- 🔍 Advanced filtering (gender, country, city)
- 📞 Contact form

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- PM2 (for production)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment to Linux VPS

### Prerequisites

- Linux VPS with SSH access
- Node.js 18+ (will be installed by setup script)
- Git

### Quick Setup

1. **Connect to your VPS via SSH:**
   ```bash
   ssh username@your-vps-ip
   ```

2. **Download and run the setup script:**
   ```bash
   curl -o setup.sh https://raw.githubusercontent.com/justatestsara/esc/main/setup.sh
   chmod +x setup.sh
   ./setup.sh
   ```
   
   Or clone the repo and run:
   ```bash
   git clone https://github.com/justatestsara/esc.git /var/www/escort-de
   cd /var/www/escort-de
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Follow the prompts** to configure your domain and Nginx (optional)

### Manual Setup Steps

If you prefer manual setup:

```bash
# 1. Create app directory
sudo mkdir -p /var/www/escort-de
sudo chown -R $USER:$USER /var/www/escort-de

# 2. Clone repository
cd /var/www/escort-de
git clone https://github.com/justatestsara/esc.git .

# 3. Install Node.js (using NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 4. Install PM2
npm install -g pm2

# 5. Install dependencies
npm install --production

# 6. Build application
npm run build

# 7. Start application
pm2 start server.js --name escort-de
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### Automated Deployment via GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys when you push to the `main` branch.

**Setup GitHub Secrets:**

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VPS_HOST`: Your VPS IP address or hostname
   - `VPS_USERNAME`: Your SSH username
   - `VPS_SSH_KEY`: Your private SSH key (generate with `ssh-keygen -t ed25519`)
   - `VPS_PORT`: SSH port (usually 22)

**Generate SSH Key for Deployment:**

```bash
# On your VPS
ssh-keygen -t ed25519 -C "deploy@vps"
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_ed25519  # Copy this to GitHub Secrets as VPS_SSH_KEY
```

**Manual Deployment:**

If you need to deploy manually:

```bash
cd /var/www/escort-de
./deploy.sh
```

### Nginx Configuration (Optional)

If you want to use Nginx as a reverse proxy, the setup script can configure it automatically, or you can manually create:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
    }
}
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs escort-de

# Restart application
pm2 restart escort-de

# Stop application
pm2 stop escort-de

# Monitor
pm2 monit
```

## Environment Variables

Create a `.env.local` file for local development (not needed for basic setup):

```env
NODE_ENV=production
PORT=3000
```

## Project Structure

```
escort-de/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── ad/                 # Ad detail pages
│   ├── legal/              # Legal pages
│   ├── post-ad/            # Post ad page
│   └── page.tsx            # Home page
├── .github/
│   └── workflows/          # GitHub Actions
├── deploy.sh               # Deployment script
├── setup.sh                # Initial setup script
├── server.js               # Production server
└── package.json
```

## License

Private - All rights reserved

## Support

For issues or questions, please contact through the contact form on the website.
