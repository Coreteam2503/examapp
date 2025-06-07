#!/bin/bash

# Agentic Mesh Quiz App - Stop Script
# Stops ONLY processes running on ports 3000 and 8000

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo -e "${BLUE}[STOP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

header() {
    echo -e "${PURPLE}$1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Source utility scripts
source "$SCRIPT_DIR/port_manager.sh"
source "$SCRIPT_DIR/process_manager.sh"

main() {
    header "=== Agentic Mesh Quiz App - Stop Script ==="
    
    log "Stopping ONLY services on ports 3000 and 8000..."
    
    # First try to stop tracked processes cleanly (our own PID files)
    stop_tracked_processes
    
    # Then kill anything still running on our specific ports
    kill_port 3000 "Frontend"
    kill_port 8000 "Backend"
    
    # Stop only our specific PM2 processes if any
    stop_pm2_processes
    
    # Final verification
    sleep 1
    local remaining_3000=$(lsof -ti:3000 2>/dev/null || true)
    local remaining_8000=$(lsof -ti:8000 2>/dev/null || true)
    
    if [ -n "$remaining_3000" ] || [ -n "$remaining_8000" ]; then
        echo ""
        echo -e "${YELLOW}Warning: Some processes may still be running:${NC}"
        [ -n "$remaining_3000" ] && echo "  Port 3000: $remaining_3000"
        [ -n "$remaining_8000" ] && echo "  Port 8000: $remaining_8000"
        echo ""
        echo "You can manually kill them with:"
        [ -n "$remaining_3000" ] && echo "  kill -9 $remaining_3000"
        [ -n "$remaining_8000" ] && echo "  kill -9 $remaining_8000"
    else
        success "All target services stopped successfully"
    fi
    
    echo ""
    success "Stop completed - only ports 3000 and 8000 were targeted!"
}

# Handle help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0"
    echo ""
    echo "This script stops ONLY Agentic Mesh Quiz App processes by:"
    echo "  1. Stopping processes tracked in PID files (safe)"
    echo "  2. Freeing ONLY ports 3000 and 8000"
    echo "  3. Cleaning up specific PM2 processes (agentic-mesh-* only)"
    echo ""
    echo "This script will NOT affect other services or ports."
    echo ""
    exit 0
fi

main
