#!/bin/bash

# Brickyard Boarding Website Installation Script for Proxmox LXC
# This script installs and configures the website on a Debian/Ubuntu-based container

set -e  # Exit on error

echo "=========================================="
echo "Brickyard Boarding Website Installation"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "Cannot detect OS version"
    exit 1
fi

echo -e "${GREEN}Detected OS: $OS $VER${NC}"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install nginx and required packages
echo -e "${YELLOW}Installing nginx and required packages...${NC}"
apt-get install -y nginx curl wget

# Install certbot for SSL (optional)
echo -e "${YELLOW}Installing certbot for SSL support...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Create website directory
WEB_DIR="/var/www/brickyard"
echo -e "${YELLOW}Creating website directory: $WEB_DIR${NC}"
mkdir -p $WEB_DIR
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR

# Copy website files (assuming script is run from project directory)
echo -e "${YELLOW}Copying website files...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if we're in the project directory
if [ ! -f "$SCRIPT_DIR/index.html" ]; then
    echo -e "${YELLOW}Warning: index.html not found in script directory${NC}"
    echo "Please run this script from the project root directory"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy all website files
cp -r "$SCRIPT_DIR"/* "$WEB_DIR/" 2>/dev/null || true

# Remove installation script from web directory
rm -f "$WEB_DIR/install.sh"
rm -f "$WEB_DIR/README.md"  # Optional: remove README from web root

# Create nginx configuration
echo -e "${YELLOW}Creating nginx configuration...${NC}"
cat > /etc/nginx/sites-available/brickyard <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name _;  # Replace with your domain name
    
    root $WEB_DIR;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json image/svg+xml;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main location
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Admin page
    location /admin {
        try_files \$uri /admin.html;
    }
    
    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable site
echo -e "${YELLOW}Enabling nginx site...${NC}"
ln -sf /etc/nginx/sites-available/brickyard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test nginx configuration
echo -e "${YELLOW}Testing nginx configuration...${NC}"
nginx -t

# Start and enable nginx
echo -e "${YELLOW}Starting nginx service...${NC}"
systemctl enable nginx
systemctl restart nginx

# Get IP address
IP=$(hostname -I | awk '{print $1}')

# Display completion message
echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Website files location: $WEB_DIR"
echo "Nginx configuration: /etc/nginx/sites-available/brickyard"
echo ""
echo -e "${YELLOW}Access your website at:${NC}"
echo "  http://$IP"
echo "  http://$IP/admin"
echo ""
echo -e "${YELLOW}To set up SSL/HTTPS:${NC}"
echo "  1. Update server_name in nginx config with your domain"
echo "  2. Run: certbot --nginx -d yourdomain.com"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: journalctl -u nginx -f"
echo "  Reload nginx: systemctl reload nginx"
echo "  Check status: systemctl status nginx"
echo ""

