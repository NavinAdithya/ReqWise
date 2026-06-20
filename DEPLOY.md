# REQWISE - Release & Deployment Guide

This document outlines the procedures for multi-environment configuration, production deployment, and system recovery.

---

## 1. Multi-Environment Configuration

Separation of concerns between `development`, `staging`, and `production` environments is managed via environment files and separate configuration variables.

### 1.1 Environment Config Schemas

#### Development (`.env.development`)
*   `PORT=5000`
*   `MONGODB_URI=mongodb://127.0.0.1:27017/reqwise_dev`
*   `JWT_SECRET=dev_secret_key_12345`
*   `NODE_ENV=development`
*   `CORS_ORIGIN=http://localhost:5173`

#### Staging (`.env.staging`)
*   `PORT=5000`
*   `MONGODB_URI=mongodb://mongodb-staging.internal:27017/reqwise_staging`
*   `JWT_SECRET=staging_secret_key_67890_secure_long`
*   `NODE_ENV=staging`
*   `CORS_ORIGIN=https://staging.reqwise.internal`

#### Production (`.env.production`)
*   `PORT=80` (or behind reverse-proxy port `5000`)
*   `MONGODB_URI=mongodb+srv://reqwise-prod-db-cluster.mongodb.net/reqwise_prod?retryWrites=true&w=majority`
*   `JWT_SECRET=PROD_CRITICAL_HIGH_ENTROPY_JWT_KEY_982348123984`
*   `NODE_ENV=production`
*   `CORS_ORIGIN=https://app.reqwise.com`

---

## 2. Production Security Configuration

To maintain strict security standards in production without bloating the Node application process, we recommend enforcing security headers, CORS limits, and Rate Limiting at the reverse proxy layer (e.g. Nginx).

### 2.1 Nginx Production Config Example

Place the following configuration inside your Nginx server block (`/etc/nginx/sites-available/reqwise`):

```nginx
# Rate Limiting Definition
limit_req_zone $binary_remote_addr zone=api_limit_zone:10m rate=10r/s;

server {
    listen 8443 ssl http2;
    server_name app.reqwise.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/app.reqwise.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.reqwise.com/privkey.pem;

    # Strict Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.reqwise.com;" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Frontend Static Assets Delivery
    location / {
        root /var/www/reqwise/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxying with Rate Limiting
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Apply Rate Limit
        limit_req zone=api_limit_zone burst=20 nodelay;
    }
}
```

---

## 3. Database Recovery & Ops Guide

### 3.1 Database Backups

#### Manual Backup (mongodump)
To back up the production database to a compressed archive:
```bash
mongodump --uri="mongodb+srv://..." --archive=backup_reqwise_$(date +%F).gz --gzip
```

#### Scheduled Cron Backup Job (Linux)
Add this to `/etc/cron.daily/reqwise-backup`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/reqwise"
mkdir -p "$BACKUP_DIR"
mongodump --uri="mongodb://127.0.0.1:27017/reqwise" --archive="$BACKUP_DIR/backup_$(date +%F).gz" --gzip
# Keep only last 30 days
find "$BACKUP_DIR" -type f -mtime +30 -name "*.gz" -delete
```

### 3.2 Database Restore (mongorestore)
To restore a backup into a fresh database:
```bash
mongorestore --uri="mongodb://127.0.0.1:27017/reqwise" --archive=backup_reqwise_2026-06-07.gz --gzip --drop
```

### 3.3 Recovery Procedures (OOM or Crash Recovery)
If MongoDB halts due to out-of-memory constraints:
1.  Verify RAM allocation limits using:
    ```bash
    free -m
    ```
2.  Start mongod specifying limited WiredTiger cache size directly in configurations:
    ```bash
    mongod --config /etc/mongod.conf --wiredTigerCacheSizeGB 0.5
    ```
3.  For containerized environments (Docker Compose), limit memory dynamically:
    ```yaml
    services:
      mongodb:
        image: mongo:8.0
        container_name: reqwise-db
        deploy:
          resources:
            limits:
              memory: 1024M
        command: ["--wiredTigerCacheSizeGB", "0.25", "--setParameter", "diagnosticDataCollectionEnabled=false"]
    ```
