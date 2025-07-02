#!/bin/bash

# 🚀 Copy Only Database to EC2

set -e  # Exit on error

# Configuration
REMOTE_USER="ec2-user"
REMOTE_HOST="13.234.76.120"
SSH_KEY="~/.ssh/KeyPair-Sekhar_opensshKey"
REMOTE_DIR="/home/ec2-user/server"
LOCAL_DB_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend/data/quiz_app.db"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "[COPY_DB] $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

log "Starting DB copy to $REMOTE_USER@$REMOTE_HOST"

# Validate local DB exists
if [[ ! -f "$LOCAL_DB_PATH" ]]; then
  error "Database file not found at $LOCAL_DB_PATH"
  exit 1
fi

# Test SSH connection
log "Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connected'" >/dev/null 2>&1; then
  error "SSH connection failed"
  exit 1
fi
success "SSH connection OK"

# Ensure remote directory exists
log "Ensuring remote directory exists..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR/backend/data"

 # Copy the database and associated WAL/SHM files
log "Copying database and WAL/SHM files..."

DB_BASENAME=$(basename "$LOCAL_DB_PATH")
DB_DIR=$(dirname "$LOCAL_DB_PATH")

FILES_TO_COPY=("$LOCAL_DB_PATH")

# Check for WAL and SHM files
[[ -f "$LOCAL_DB_PATH-wal" ]] && FILES_TO_COPY+=("$LOCAL_DB_PATH-wal")
[[ -f "$LOCAL_DB_PATH-shm" ]] && FILES_TO_COPY+=("$LOCAL_DB_PATH-shm")

if [[ ${#FILES_TO_COPY[@]} -gt 1 ]]; then
  log "WAL/SHM files found. Copying all SQLite components..."
else
  log "No WAL/SHM files found. Copying main DB only..."
fi

scp -i "$SSH_KEY" "${FILES_TO_COPY[@]}" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/backend/data/"
success "Database and related files copied successfully"

# Verify DB integrity on remote
log "Verifying SQLite DB integrity on remote..."
INTEGRITY_RESULT=$(ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "sqlite3 $REMOTE_DIR/backend/data/$DB_BASENAME 'PRAGMA integrity_check;'")

if [[ "$INTEGRITY_RESULT" == "ok" ]]; then
  success "Remote DB integrity verified: OK"
else
  error "Remote DB integrity check failed: $INTEGRITY_RESULT"
  exit 1
fi

log "Done. To verify, SSH into server and run:"
echo "  ls -l $REMOTE_DIR/backend/data/"