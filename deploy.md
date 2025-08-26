#!/bin/bash

# Set variables

APP_NAME="scientific-client"
PROJECT_DIR="/opt/client/scientific"
DEPLOY_BASE="/opt/deployment/resource/scientific-client/versions"
DEPLOY_PM2="/opt/deployment/resource/scientific-client"
BUILD_DIR=".next/standalone"
MAX_VERSIONS=2
PORT=3000

echo "============================="
echo "🚀 Starting Deployment Script with Numeric Versioning"
echo "============================="

# Step 1: Navigate to the project directory

echo "📂 Navigating to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || { echo "❌ Failed to navigate to project directory"; exit 1; }

# Step 1.1:

git checkout .
git checkout production
git fetch
git cherry-pick 9957ba76a735c7cce25f3df9fc194671d969edb4
#git pull origin dev --rebase

# Step 2: Install dependencies and build the project

echo "📦 Installing dependencies"
yarn
if [ $? -ne 0 ]; then
echo "❌ Failed to install dependencies"
exit 1
fi
cat .env
echo "🔨 Building the Next.js application"
yarn build
if [ $? -ne 0 ]; then
echo "❌ Build failed"
exit 1
fi

# Step 3: Copy .next/static and .next/server to .next/standalone/.next

echo "📂 Preparing build artifacts"
mkdir -p "$BUILD_DIR/.next"
cp -R .next/static "$BUILD_DIR/.next/"
cp -R .next/server "$BUILD_DIR/.next/"

# Step 4: Copy public to .next/standalone/public

cp -R public "$BUILD_DIR/public"

# Step 5: Determine the next numeric version

if [ -d "$DEPLOY_BASE" ]; then
LATEST_VERSION=$(ls -1 "$DEPLOY_BASE" | grep -E '^[0-9]+$' | sort -n | tail -n 1)
  if [ -z "$LATEST_VERSION" ]; then
NEXT_VERSION=1
else
NEXT_VERSION=$((LATEST_VERSION + 1))
fi
else
NEXT_VERSION=1
fi

DEPLOY_DIR="$DEPLOY_BASE/$NEXT_VERSION"
echo "📂 Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Step 6: Copy build files to the versioned directory

echo "📁 Copying build files to deployment directory"
cp -R "$BUILD_DIR/." "$DEPLOY_DIR/"

# Step 7: Update symlink to point to the latest version

echo "🔗 Updating current version symlink"
ln -sfn "$DEPLOY_DIR" "$DEPLOY_BASE/current"

# Step 7.1: Copy .env file to the current directory

if [ -f "$DEPLOY_PM2/.env" ]; then
echo "📄 Copying .env file to the current directory"
cat $DEPLOY_PM2/.env
  cp "$DEPLOY_PM2/.env" "$DEPLOY_BASE/current/.env"
else
echo "⚠️ No .env file found in $DEPLOY_PM2"
fi

# Step 7.1: Copy pm2.config.js file to the current directory

if [ -f "$DEPLOY_PM2/pm2.config.js" ]; then
echo "📄 Copying pm2.config.js file to the current directory"
echo "path $DEPLOY_PM2/pm2.config.js"
  cp "$DEPLOY_PM2/pm2.config.js" "$DEPLOY_BASE/current/pm2.config.js"
else
echo "⚠️ No .env file found in $DEPLOY_PM2"
fi

# Step 8: Cleanup old versions

echo "�� Cleaning up old versions"
VERSION_COUNT=$(ls -1 "$DEPLOY_BASE" | grep -E '^[0-9]+$' | wc -l)
if [ "$VERSION_COUNT" -gt "$MAX_VERSIONS" ]; then
  echo "Found $VERSION_COUNT versions, keeping only the latest $MAX_VERSIONS"
  ls -1 "$DEPLOY_BASE" | grep -E '^[0-9]+$' | sort -n | head -n $((VERSION_COUNT - MAX_VERSIONS)) | while read -r OLD_VERSION; do
    OLD_VERSION_PATH="$DEPLOY_BASE/$OLD_VERSION"
    echo "❌ Removing old version: $OLD_VERSION_PATH"
    rm -rf "$OLD_VERSION_PATH"
done
else
echo "No old versions to clean up"
fi

# Step 9: Install PM2 if not installed

echo "🛠️ Checking for PM2 installation"
if ! command -v pm2 &> /dev/null; then
echo "📦 PM2 not found, installing PM2 globally"
npm install -g pm2
if [ $? -ne 0 ]; then
echo "❌ Failed to install PM2"
exit 1
fi
else
echo "✅ PM2 is already installed"
fi

# Step 10: Manage PM2 process

echo "⚙️ Managing PM2 process for $APP_NAME"
cd "$DEPLOY_BASE/current" || exit 1

# Check if the process is already running

pm2 describe "$APP_NAME" >/dev/null 2>&1
if [ $? -eq 0 ]; then
echo "🔄 Restarting PM2 process: $APP_NAME"
pm2 delete pm2.config.js
pm2 start pm2.config.js
else
echo "▶️ Starting PM2 process: $APP_NAME"
pm2 start pm2.config.js
fi

# Step 11: Save PM2 process list

echo "💾 Saving PM2 process list"
pm2 save

echo "============================="
echo "✅ Deployment Completed Successfully"
echo "============================="
