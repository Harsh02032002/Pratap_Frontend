#!/bin/bash
# ═════════════════════════════════════════════════════════════════════════
# RoomHy Production Deployment Script for VPS
# Subdomains: roomhy.com | admin.roomhy.com | app.roomhy.com
# Location: ~/roomhy/New-Roomhy-Harsh
# ═════════════════════════════════════════════════════════════════════════

set -e

echo "🚀 Starting RoomHy Multi-Domain Build & Deployment..."

# 1. Create Timestamped Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/roomhy/backup-$TIMESTAMP"
echo "📦 Creating backup of production files at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
if [ -d "/var/www/roomhy/website" ]; then cp -r /var/www/roomhy/website "$BACKUP_DIR/website"; fi
if [ -d "/var/www/roomhy/superadmin" ]; then cp -r /var/www/roomhy/superadmin "$BACKUP_DIR/superadmin"; fi
if [ -d "/var/www/roomhy/propertyowner" ]; then cp -r /var/www/roomhy/propertyowner "$BACKUP_DIR/propertyowner"; fi
echo "✅ Backup completed successfully!"

# 2. Install dependencies if needed and build all targets
echo "🔨 Building all target applications..."
npm install --legacy-peer-deps || npm install
npm run build:all

# 3. Ensure target directories exist
mkdir -p /var/www/roomhy/website
mkdir -p /var/www/roomhy/superadmin
mkdir -p /var/www/roomhy/propertyowner

# 4. Deploy distinct build artifacts
echo "📂 Deploying Main Website build to /var/www/roomhy/website/..."
cp -r dist/website/* /var/www/roomhy/website/

echo "📂 Deploying Super Admin & SEO Admin build to /var/www/roomhy/superadmin/..."
cp -r dist/superadmin/* /var/www/roomhy/superadmin/

echo "📂 Deploying Property Owner build to /var/www/roomhy/propertyowner/..."
cp -r dist/propertyowner/* /var/www/roomhy/propertyowner/

# 5. Verification & MD5 Checksums
echo "---------------------------------------------------------"
echo "VERIFICATION OF DEPLOYED INDEX.HTML CHECKSUMS:"
echo "---------------------------------------------------------"
md5sum /var/www/roomhy/website/index.html
md5sum /var/www/roomhy/superadmin/index.html
md5sum /var/www/roomhy/propertyowner/index.html
echo "---------------------------------------------------------"
echo "🎉 Deployment finished successfully!"
