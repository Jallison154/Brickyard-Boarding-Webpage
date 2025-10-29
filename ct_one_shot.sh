#!/usr/bin/env bash

set -euo pipefail

###############################
# Brickyard CT One-Shot Setup #
###############################
#
# What this script does (idempotent):
# - Installs Nginx, Git, Rsync (if missing)
# - Clones or updates the repo to /root/Brickyard-Boarding-Webpage
# - Deploys site to /var/www/brickyard-kennel via rsync --delete
# - Creates/enables Nginx server block (if missing)
# - Reloads Nginx and prints a short verification report
#
# Run on the CT as root.

REPO_URL="https://github.com/Jallison154/Brickyard-Boarding-Webpage.git"
REPO_DIR="/root/Brickyard-Boarding-Webpage"
WEB_ROOT="/var/www/brickyard-kennel"
SITE_NAME="brickyard-kennel"
REPORT="/root/${SITE_NAME}-report.txt"

log() { printf "\033[1;32m[+] %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m[!] %s\033[0m\n" "$*"; }
err() { printf "\033[1;31m[x] %s\033[0m\n" "$*"; }

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    err "Please run as root."; exit 1
  fi
}

install_packages() {
  log "Installing required packages..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends nginx git rsync ca-certificates curl
}

clone_or_update_repo() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    log "Updating repository in $REPO_DIR ..."
    git -C "$REPO_DIR" fetch --all --prune
    git -C "$REPO_DIR" reset --hard origin/main
  else
    log "Cloning repository to $REPO_DIR ..."
    rm -rf "$REPO_DIR"
    git clone "$REPO_URL" "$REPO_DIR"
  fi
}

deploy_site() {
  log "Deploying to $WEB_ROOT ..."
  mkdir -p "$WEB_ROOT"
  rsync -av --delete \
    --exclude='.git/' \
    --exclude='*.md' \
    --exclude='download_images.*' \
    --exclude='*.ps1' \
    "$REPO_DIR"/ "$WEB_ROOT"/

  chown -R www-data:www-data "$WEB_ROOT"
  find "$WEB_ROOT" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -exec chmod 0644 {} +
}

ensure_nginx_site() {
  local site_available="/etc/nginx/sites-available/$SITE_NAME"
  local site_enabled="/etc/nginx/sites-enabled/$SITE_NAME"

  if [[ ! -f "$site_available" ]]; then
    log "Creating Nginx server block $SITE_NAME ..."
    cat > "$site_available" <<CONF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root $WEB_ROOT;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Basic security headers (static site)
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
}
CONF
  fi

  # Disable default if present; enable our site
  if [[ -L "/etc/nginx/sites-enabled/default" ]]; then
    rm -f "/etc/nginx/sites-enabled/default"
  fi
  ln -sf "$site_available" "$site_enabled"

  log "Testing Nginx configuration..."
  nginx -t

  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl restart nginx
}

print_report() {
  log "Generating verification report at $REPORT ..."
  {
    echo "==== Brickyard CT Report ($(date -Is)) ===="
    echo
    echo "-- OS Release --"; cat /etc/os-release || true; echo
    echo "-- Repo Status --"; git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo "(no git)"; echo
    echo "-- Nginx Root --"; grep -R "root " /etc/nginx/sites-enabled | sed -e 's/^[[:space:]]*//' || true; echo
    echo "-- Checksums --"; \
      if [[ -f "$WEB_ROOT/index.html" && -f "$REPO_DIR/index.html" ]]; then \
        md5sum "$WEB_ROOT/index.html" "$REPO_DIR/index.html"; else echo "(index.html missing)"; fi; echo
    echo "-- Open Ports --"; ss -ltnp | egrep ':80 |:443 ' || true; echo
    echo "-- Curl Preview --"; curl -s http://127.0.0.1 | head -n 20 || true; echo
  } > "$REPORT"

  local ip
  ip=$(hostname -I 2>/dev/null | awk '{print $1}') || ip="<CT-IP>"
  echo
  log "Website deployed! Try: http://$ip"
  log "Report saved to: $REPORT"
}

main() {
  require_root
  install_packages
  clone_or_update_repo
  deploy_site
  ensure_nginx_site
  print_report
}

main "$@"


