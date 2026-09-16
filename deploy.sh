#!/bin/bash

# --- CONFIGURATION ---
SERVER_IP="62.171.141.151"
SERVER_USER="root"               # Replace with your SSH username (e.g., ubuntu, root, etc.)
TARGET_DIR="/var/www/school"
LOCAL_BUILD_DIR="dist"           # Change to "build" if not using Vite

# Exit immediately if any command fails
set -e

echo "🚀 Starting Local React App Deployment..."

# 1. Build the project locally
echo "📦 Building production bundle locally..."
npm run build

# 2. Upload files and clean the remote directory in one streamlined step
# rsync is faster than scp because it compresses files and handles modifications cleanly
echo "🚚 Uploading fresh assets via SSH/Rsync..."
rsync -avz --delete ./$LOCAL_BUILD_DIR/ $SERVER_USER@$SERVER_IP:$TARGET_DIR/

# 3. Connect to the server to reset permissions and reload Nginx
echo "🔒 Fixing permissions and reloading Nginx on the server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    sudo chown -R www-data:www-data /var/www/school
    sudo chmod -R 755 /var/www/school
    sudo systemctl reload nginx
EOF

echo "✅ Local deployment to $SERVER_IP finished successfully!"
