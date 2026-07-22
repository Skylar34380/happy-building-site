#!/bin/bash

set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_ROOT="$(mktemp -d /private/tmp/twoform-azure-deploy.XXXXXX)"

echo "Cloning GitHub repository..."
git clone https://github.com/Skylar34380/happy-building-site.git "$DEPLOY_ROOT"

echo "Copying the current 2Form site without local secrets or uploaded media..."
rsync -a --delete \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.DS_Store' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='outputs/' \
  --exclude='work/' \
  --exclude='mycloud-project-covers/' \
  --exclude='mycloud-project-gallery/' \
  --exclude='assets/project-covers/' \
  --exclude='public/assets/project-covers/' \
  --exclude='public/assets/project-gallery/' \
  "$SOURCE_ROOT/" "$DEPLOY_ROOT/"

cd "$DEPLOY_ROOT"
git add -A

if git diff --cached --quiet; then
  echo "GitHub already has the current files. Nothing to push."
  exit 0
fi

git commit -m "Deploy Azure site and admin workflow"
git push origin main

echo "Push complete. GitHub Actions will now deploy the site to Azure."
