# Quick Proxmox Setup Guide

## Step-by-Step: Setting Up Brickyard Boarding Website on Proxmox

### 1. Create LXC Container in Proxmox

1. **In Proxmox Web UI:**
   - Login to Proxmox
   - Right-click on your node → "Create CT"

2. **General Settings:**
   - **Container ID:** (auto or choose)
   - **Hostname:** `brickyard-web`
   - **Password:** (set root password)
   - **Template:** Debian 11 or Ubuntu 22.04

3. **Resources:**
   - **CPU:** 1 core (minimum)
   - **Memory:** 512MB-1GB
   - **Disk:** 4GB (minimum)
   - **Network:** Bridge (default)

4. **Finish** and start the container

### 2. Transfer Files to Container

**Option A: Using SCP (from your local machine)**
```powershell
# In PowerShell on Windows
scp -r "Brickyard Boarding Webpage" root@<CONTAINER_IP>:/root/
```

**Option B: Using Proxmox Console + Web Upload**
1. In Proxmox Web UI, open container console
2. Upload files via Proxmox file browser or use wget

**Option C: Using Git (if you have a repo)**
```bash
# In container
apt-get update && apt-get install -y git
git clone <your-repo-url> /root/brickyard
```

### 3. Run Installation Script

```bash
# Access container console or SSH
pct enter <VMID>
# OR
ssh root@<CONTAINER_IP>

# Navigate to project
cd "/root/Brickyard Boarding Webpage"

# Make executable and run
chmod +x install.sh
./install.sh
```

### 4. Access Your Website

Once installation completes:
- **Main site:** `http://<CONTAINER_IP>`
- **Admin panel:** `http://<CONTAINER_IP>/admin`

### 5. (Optional) Configure Domain Name

1. **Get container IP:**
   ```bash
   hostname -I
   ```

2. **Update DNS** to point your domain to the container IP

3. **Configure nginx with domain:**
   ```bash
   nano /etc/nginx/sites-available/brickyard
   ```
   Change: `server_name _;` → `server_name yourdomain.com;`

4. **Get SSL certificate:**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

### Troubleshooting Quick Fixes

**Can't access website:**
```bash
# Check if nginx is running
systemctl status nginx

# Check port 80
netstat -tlnp | grep :80

# Check nginx config
nginx -t
```

**Permission errors:**
```bash
chown -R www-data:www-data /var/www/brickyard
```

**Container won't start:**
- Check resources in Proxmox
- Increase memory/disk if needed
- Check logs in Proxmox UI

### Useful Proxmox Commands

```bash
# List containers
pct list

# Start container
pct start <VMID>

# Stop container
pct stop <VMID>

# Access container shell
pct enter <VMID>

# View container config
pct config <VMID>
```

### Container Resource Monitoring

In Proxmox Web UI:
- Container → Summary (shows real-time stats)
- Container → Monitor (detailed monitoring)

### Backup Strategy

**Option 1: Proxmox Snapshots**
- Right-click container → Snapshot
- Can restore entire container state

**Option 2: Manual Backup**
```bash
# In container
tar -czf /root/backup.tar.gz /var/www/brickyard /etc/nginx/sites-available/brickyard
```

**Option 3: Proxmox Backup Server**
- Set up PBS for automated backups
- Schedule regular backups

