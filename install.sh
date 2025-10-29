#!/bin/bash

# Quick installation script for Brickyard Boarding Kennel with PUBLIC repository
# Run this on your Proxmox CT

set -e

echo "🚀 Installing Brickyard Boarding Kennel website from public repository..."

# 1. Update system packages
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install required packages
echo "🔧 Installing required packages..."
apt-get install -y git nginx

# 3. Clone the public repository
echo "📥 Cloning repository..."
cd /root
git clone https://github.com/Jallison154/Brickyard-Boarding-Webpage.git

# 4. Navigate to project directory
echo "📁 Navigating to project directory..."
cd Brickyard-Boarding-Webpage

# 5. Make installation script executable
echo "⚙️ Setting up installation script..."
chmod +x install.sh

# 6. Run the installation script
echo "🏗️ Installing website..."
./install.sh

echo "✅ Installation complete!"
echo "🌐 Your website is now accessible at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📋 To update in the future, run:"
echo "   cd /root/Brickyard-Boarding-Webpage"
echo "   git pull origin main"
echo "   rsync -av --exclude='.git/' --exclude='install.sh' --exclude='*.md' --exclude='*.py' --exclude='*.ps1' --exclude='*.js' --exclude='*.html' --exclude='CT_*.txt' . /var/www/brickyard-kennel/"
echo "   systemctl restart nginx"
