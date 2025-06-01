#!/bin/bash

# Process Management Utility
# Handles killing application-specific processes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[PROCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern=$1
    local service_name=${2:-"Process"}
    
    log "Cleaning up $service_name processes..."
    
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log "Found $service_name processes: $pids"
        
        # Graceful termination
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(pgrep -f "$pattern" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            warning "Force killing $service_name processes"
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        
        success "$service_name processes cleaned up"
    else
        log "No $service_name processes found"
    fi
}

# Function to stop PM2 processes
stop_pm2_processes() {
    if ! command -v pm2 >/dev/null 2>&1; then
        log "PM2 not installed, skipping"
        return 0
    fi
    
    log "Stopping PM2 processes..."
    
    pm2 stop agentic-mesh-backend 2>/dev/null || true
    pm2 stop agentic-mesh-frontend 2>/dev/null || true
    pm2 delete agentic-mesh-backend 2>/dev/null || true
    pm2 delete agentic-mesh-frontend 2>/dev/null || true
    
    success "PM2 processes cleaned up"
}

# Function to stop all application processes
stop_app_processes() {
    log "Stopping all application processes..."
    
    # Kill specific process patterns
    kill_by_pattern "react-scripts start" "React Dev Server"
    kill_by_pattern "node.*server.js" "Node Backend"
    kill_by_pattern "nodemon.*server.js" "Nodemon Backend"
    kill_by_pattern "npm.*start" "NPM Start Processes"
    kill_by_pattern "serve -s build" "Production Frontend"
    kill_by_pattern "agentic.*mesh" "Agentic Mesh Processes"
    
    # Stop PM2 processes
    stop_pm2_processes
    
    success "All application processes stopped"
}

# Main function when script is called directly
main() {
    case "$1" in
        pattern)
            if [ -z "$2" ]; then
                echo "Usage: $0 pattern <pattern> [service_name]"
                exit 1
            fi
            kill_by_pattern "$2" "$3"
            ;;
        pm2)
            stop_pm2_processes
            ;;
        all)
            stop_app_processes
            ;;
        *)
            echo "Usage: $0 {pattern|pm2|all} [options]"
            echo ""
            echo "Commands:"
            echo "  pattern <pattern> [name]  Kill processes matching pattern"
            echo "  pm2                       Stop PM2 processes"
            echo "  all                       Stop all application processes"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
