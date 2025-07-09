#!/bin/bash

# 🚀 Robust EC2 Deployment Script

set -e  # Exit on any error

# Configuration
REMOTE_USER="ec2-user"
REMOTE_HOST="13.234.76.120"
SSH_KEY="~/.ssh/KeyPair-Sekhar_opensshKey"
REMOTE_DIR="/home/ec2-user/server"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Parse arguments - keeping for future use if needed
if [[ "$1" == "--verbose" ]]; then
  log "Verbose mode enabled"
fi

log "Starting deployment to $REMOTE_USER@$REMOTE_HOST"

# Test SSH connection
log "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connected'" >/dev/null 2>&1; then
  error "SSH connection failed"
  exit 1
fi
success "SSH connection OK"

# Stop remote backend server cleanly
log "Stopping remote backend server..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_DIR || mkdir -p $REMOTE_DIR
  if [[ -f backend.pid ]]; then
    kill \$(cat backend.pid) && echo 'Backend stopped' || echo 'Backend already stopped'
    rm -f backend.pid
  else
    echo 'No backend PID found'
  fi
" || true

# Copy backend files
log "Copying backend files..."
rsync -avz --delete --exclude='node_modules' --exclude='data' \
  -e "ssh -i $SSH_KEY" \
  "$PROJECT_ROOT/backend/" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/backend/"

# Build and copy frontend using production env
log "Building and copying frontend..."
cd "$PROJECT_ROOT/frontend"
cp .env.production .env
npm run build >/dev/null 2>&1
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  "$PROJECT_ROOT/frontend/build/" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/frontend/"

# Install dependencies and start backend
log "Installing dependencies and starting backend..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_DIR/backend

  # Create logs directory
  mkdir -p ../logs

  # Install backend dependencies
  npm install --production

  # Start backend server in background
  nohup node src/server.js > ../logs/backend.log 2>&1 &
  echo \$! > ../backend.pid
  echo 'Backend server started'

  # Give it a moment to start
  sleep 3

  # Verify backend is running
  if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
    echo '✅ Backend health check: OK'
  else
    echo '❌ Backend may not be running properly, check logs'
  fi
"

success "Deployment completed!"
log "Backend: http://$REMOTE_HOST:8000/api"
log "Frontend: http://$REMOTE_HOST/"
log "Check logs: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'tail -f $REMOTE_DIR/logs/backend.log'"
log "SSH to server: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST"