# Brickyard Backend (Node + SQLite)

This adds a tiny API for secure storage of clients and animals. It runs as a service on the CT and Nginx can proxy /api to it.

## Install (on the CT)

```bash
# 1) Install Node and build tools
apt-get update -y && apt-get install -y nodejs npm

# 2) Create env and install deps
cd /root/Brickyard-Boarding-Webpage/backend
cp -n .env.example .env || true
# Edit .env and set a long random API_TOKEN
nano .env
npm ci || npm install

# 3) Start once (foreground test)
NODE_ENV=production npm start
# You should see: Brickyard backend listening on :3000
```

Optionally, create a simple systemd unit:

```bash
cat >/etc/systemd/system/brickyard-backend.service <<'UNIT'
[Unit]
Description=Brickyard Backend
After=network.target

[Service]
WorkingDirectory=/root/Brickyard-Boarding-Webpage/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
User=root
Group=root

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now brickyard-backend
```

## Nginx proxy (on the CT)
Add this inside your existing server block:

```
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then reload:

```bash
nginx -t && systemctl reload nginx
```

## API

Auth: send header Authorization: Bearer <API_TOKEN>

- GET /api/health
- GET /api/clients?limit=50&offset=0
- GET /api/clients/:id
- POST /api/clients body:
```json
{
  "familyName": "Smith",
  "contactName": "John Smith",
  "email": "john@example.com",
  "phone": "406-555-1234",
  "animals": [
    { "name": "Kida", "animalType": "Dog", "breed": "Belgian", "age": "6", "weight": "65" }
  ]
}
```
- PUT /api/clients/:id body: any fields to update
- DELETE /api/clients/:id

## Frontend integration (phase 2)
- Swap localStorage usages in `clients.js` and `quick-add-animal.js` to call the API with the bearer token.
- For now, the site continues to work with localStorage so you can migrate gradually.
