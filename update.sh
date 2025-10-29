#!/bin/bash

# Update script for Brickyard Boarding Kennel with PUBLIC repository
# Run this to update your website

set -e

echo "🔄 Updating Brickyard Boarding Kennel website..."

# 1. Navigate to project directory
cd /root/Brickyard-Boarding-Webpage

# 2. Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# 3. Copy updated files to web directory
echo "📋 Copying updated files..."
rsync -av --exclude='.git/' --exclude='install.sh' --exclude='update_*.sh' --exclude='CT_*.txt' --exclude='*.md' --exclude='*.py' --exclude='*.ps1' --exclude='generate-test-data.js' --exclude='load-test-data.html' --exclude='test-clients.html' . /var/www/brickyard-kennel/

# 4. Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/brickyard-kennel
chmod -R 755 /var/www/brickyard-kennel

# 5. Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# 6. Restart Nginx if configuration is valid
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid. Restarting Nginx..."
    systemctl restart nginx
    echo "🎉 Website update completed successfully!"
    echo "🌐 Your website is now updated and running at: http://$(hostname -I | awk '{print $1}')"
else
    echo "❌ Nginx configuration test failed. Please check the configuration."
    exit 1
fi
