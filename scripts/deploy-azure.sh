#!/bin/bash

set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_ROOT="$(mktemp -d /private/tmp/twoform-azure-deploy.XXXXXX)"
BRANCH="${1:-site-update-$(date +%Y%m%d-%H%M%S)}"

echo "Cloning GitHub repository..."
git clone https://github.com/Skylar34380/happy-building-site.git "$DEPLOY_ROOT"

echo "Copying the current 2Form site without local secrets or uploaded media..."
rsync -a --delete \
  --exclude='.git/' \
  --exclude='.DS_Store' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='outputs/' \
  --exclude='work/' \
  --exclude='upload-fixes/' \
  --exclude='mycloud-project-covers/' \
  --exclude='mycloud-project-gallery/' \
  --exclude='assets/project-covers/' \
  --exclude='public/assets/project-covers/' \
  --exclude='public/assets/project-gallery/' \
  "$SOURCE_ROOT/" "$DEPLOY_ROOT/"

cd "$DEPLOY_ROOT"
git switch -c "$BRANCH"
git add -A

if git diff --cached --quiet; then
  echo "GitHub already has the current files. Nothing to push."
  exit 0
fi

git commit -m "Update 2Form website"
git push -u origin "$BRANCH"

echo "Push complete. Open a pull request from $BRANCH into main; Azure deploys after it is merged."
