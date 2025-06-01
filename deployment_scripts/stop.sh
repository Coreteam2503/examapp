#!/bin/bash

# Agentic Mesh Quiz App - Stop Script
# Stops all application processes and frees ports

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

# Source utility scripts
source "$SCRIPT_DIR/port_manager.sh"
source "$SCRIPT_DIR/process_manager.sh"

main() {
    header "=== Agentic Mesh Quiz App - Stop Script ==="
    
    log "Stopping all application processes..."
    
    # Stop application processes
    stop_app_processes
    
    # Kill processes on specific ports
    kill_port 3000 "Frontend"
    kill_port 8000 "Backend"
    
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
        success "All application services stopped successfully"
    fi
    
    echo ""
    success "Stop completed!"
}

# Handle help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0"
    echo ""
    echo "This script stops all Agentic Mesh Quiz App processes by:"
    echo "  1. Stopping application-specific processes"
    echo "  2. Freeing ports 3000 and 8000"
    echo "  3. Cleaning up PM2 processes if any"
    echo ""
    exit 0
fi

main
