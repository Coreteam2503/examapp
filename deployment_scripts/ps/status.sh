#!/bin/bash

# Agentic Mesh Quiz App - Status Script
# Shows the current status of the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

header() {
    echo -e "${PURPLE}$1${NC}"
}

# Source utility scripts
source "$SCRIPT_DIR/health_checker.sh"

# Function to show recent logs
show_recent_logs() {
    if [ -d "$PROJECT_ROOT/logs" ]; then
        echo -e "${BLUE}📋 Recent Logs:${NC}"
        
        if [ -f "$PROJECT_ROOT/logs/backend.log" ]; then
            echo "  Backend (last 3 lines):"
            tail -n 3 "$PROJECT_ROOT/logs/backend.log" 2>/dev/null | sed 's/^/    /' || echo "    No backend logs available"
        fi
        
        if [ -f "$PROJECT_ROOT/logs/frontend.log" ]; then
            echo "  Frontend (last 3 lines):"
            tail -n 3 "$PROJECT_ROOT/logs/frontend.log" 2>/dev/null | sed 's/^/    /' || echo "    No frontend logs available"
        fi
        echo ""
    fi
}

# Function to show PM2 status
show_pm2_status() {
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${BLUE}🔄 PM2 Processes:${NC}"
        pm2 list 2>/dev/null | grep -E "(agentic-mesh|online|stopped)" || echo "  No PM2 processes found"
        echo ""
    fi
}

# Main status function
main() {
    header "=== Agentic Mesh Quiz App - Status Check ==="
    echo ""
    
    # Check all services
    check_all_services
    
    # Show PM2 status
    show_pm2_status
    
    # Show recent logs
    show_recent_logs
    
    # Show application URLs
    header "=== Application URLs ==="
    echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}🔧 Backend API:${NC} http://localhost:8000/api"
    echo -e "${GREEN}🏥 Health Check:${NC} http://localhost:8000/api/health"
    echo ""
    
    # Show available commands
    header "=== Available Commands ==="
    echo "  ./deployment_scripts/restart.sh     - Restart the application"
    echo "  ./deployment_scripts/stop.sh        - Stop the application"
    echo "  ./deployment_scripts/status.sh      - Show this status"
    echo ""
    echo "  Individual utilities:"
    echo "  ./deployment_scripts/port_manager.sh    - Manage ports"
    echo "  ./deployment_scripts/process_manager.sh - Manage processes"
    echo "  ./deployment_scripts/health_checker.sh  - Check service health"
    echo "  ./deployment_scripts/service_starter.sh - Start services"
    echo "  ./deployment_scripts/deps_manager.sh    - Manage dependencies"
    echo ""
}

# Handle help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0"
    echo ""
    echo "This script shows the current status of all Agentic Mesh Quiz App services."
    echo ""
    exit 0
fi

# Run main function
main
