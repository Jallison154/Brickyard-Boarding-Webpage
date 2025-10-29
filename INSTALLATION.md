# Brickyard Boarding Website Installation Guide

This guide explains how to install the Brickyard Boarding website on a Proxmox LXC container.

## Prerequisites

- Proxmox VE host
- LXC container (Debian 11+ or Ubuntu 20.04+) created in Proxmox
- SSH access to the container OR access to Proxmox console

## Quick Installation

### Option 1: Using the Installation Script

1. **Copy files to the container:**
   ```bash
   # From your local machine, copy the entire project folder to the container
   # Replace CONTAINER_IP with your container's IP address
   scp -r "Brickyard Boarding Webpage" root@CONTAINER_IP:/root/
   ```

2. **SSH into the container:**
   ```bash
   ssh root@CONTAINER_IP
   ```

3. **Navigate to the project directory:**
   ```bash
   cd "/root/Brickyard Boarding Webpage"
   ```

4. **Make the script executable and run it:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

5. **Access your website:**
   - Open browser: `http://YOUR_CONTAINER_IP`
   - Admin page: `http://YOUR_CONTAINER_IP/admin`

### Option 2: Manual Installation

If you prefer to install manually:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install nginx
apt-get install -y nginx

# Create web directory
mkdir -p /var/www/brickyard
chown -R www-data:www-data /var/www/brickyard

# Copy website files to /var/www/brickyard
# (Copy all HTML, CSS, JS files and resources folder)

# Copy nginx config from install.sh and adjust as needed
# Enable and start nginx
systemctl enable nginx
systemctl restart nginx
```

## Proxmox LXC Container Setup

### Creating the Container

1. **In Proxmox Web UI:**
   - Go to your Proxmox node
   - Right-click → "Create CT"
   - Choose your settings:
     - **OS Template:** Debian 11 or Ubuntu 22.04 LTS (recommended)
     - **Resources:** 
       - 512MB RAM (minimum)
       - 2GB disk space (minimum)
       - 1 CPU core (minimum)
   - Set root password
   - Finish creation

2. **Start the container:**
   ```bash
   # In Proxmox node shell
   pct start <VMID>
   ```

3. **Access the container:**
   ```bash
   # In Proxmox node shell
   pct enter <VMID>
   
   # Or SSH (if network is configured)
   ssh root@<CONTAINER_IP>
   ```

## Post-Installation Configuration

### Setting Up SSL/HTTPS

1. **Update nginx configuration:**
   ```bash
   nano /etc/nginx/sites-available/brickyard
   ```
   Change `server_name _;` to `server_name yourdomain.com;`

2. **Get SSL certificate:**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

3. **Auto-renewal is automatic** (certbot sets up a cron job)

### Firewall Configuration

If using UFW:
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

If using iptables:
```bash
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Port Forwarding (if needed)

If your container is behind a router/firewall, configure port forwarding:
- External port 80 → Container IP:80
- External port 443 → Container IP:443

## Maintenance

### View Logs
```bash
# Nginx error logs
tail -f /var/log/nginx/error.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### Update Website Files
```bash
# Stop nginx temporarily
systemctl stop nginx

# Backup current files
cp -r /var/www/brickyard /var/www/brickyard.backup

# Copy new files (from your local machine)
scp -r "Brickyard Boarding Webpage"/* root@CONTAINER_IP:/var/www/brickyard/

# Set correct permissions
chown -R www-data:www-data /var/www/brickyard

# Restart nginx
systemctl start nginx
```

### Nginx Commands
```bash
# Test configuration
nginx -t

# Reload configuration (no downtime)
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# Check status
systemctl status nginx
```

## Troubleshooting

### Website Not Loading

1. Check if nginx is running:
   ```bash
   systemctl status nginx
   ```

2. Check nginx configuration:
   ```bash
   nginx -t
   ```

3. Check if port 80 is listening:
   ```bash
   netstat -tlnp | grep :80
   ```

4. Check firewall:
   ```bash
   ufw status
   # or
   iptables -L
   ```

### Permission Issues

If you see 403 Forbidden errors:
```bash
chown -R www-data:www-data /var/www/brickyard
chmod -R 755 /var/www/brickyard
```

### Cannot Access Admin Page

Make sure the URL is:
- `http://YOUR_IP/admin` (not `/admin.html`)

The nginx config automatically redirects `/admin` to `admin.html`.

## Container Resource Monitoring

### Check Resource Usage
```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Network usage
iftop
```

### In Proxmox UI
- Go to container → Summary
- View real-time CPU, RAM, and disk usage

## Backup

### Manual Backup
```bash
# Create backup of website files
tar -czf brickyard-backup-$(date +%Y%m%d).tar.gz -C /var/www brickyard

# Backup nginx config
cp -r /etc/nginx/sites-available/brickyard ~/nginx-brickyard-backup.conf
```

### Automated Backup (Proxmox)
- Configure Proxmox Backup Server or
- Set up scheduled snapshots in Proxmox Web UI

## Security Considerations

1. **Keep system updated:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

2. **Use SSL/HTTPS** (important for admin page)

3. **Regular backups**

4. **Monitor logs** for suspicious activity

5. **Limit SSH access** (use key-based authentication)

6. **Configure fail2ban** (optional):
   ```bash
   apt-get install fail2ban
   systemctl enable fail2ban
   ```

## Support

For issues or questions:
- Check nginx error logs: `/var/log/nginx/error.log`
- Check system logs: `journalctl -xe`
- Verify file permissions
- Ensure all files were copied correctly

