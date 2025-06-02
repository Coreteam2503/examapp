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

# Function to stop PM2 processes (only specific ones)
stop_pm2_processes() {
    if ! command -v pm2 >/dev/null 2>&1; then
        log "PM2 not installed, skipping"
        return 0
    fi
    
    log "Stopping specific PM2 processes..."
    
    # Only stop our specific PM2 processes
    pm2 stop agentic-mesh-backend 2>/dev/null || true
    pm2 stop agentic-mesh-frontend 2>/dev/null || true
    pm2 delete agentic-mesh-backend 2>/dev/null || true
    pm2 delete agentic-mesh-frontend 2>/dev/null || true
    
    success "Specific PM2 processes cleaned up"
}

# Function to stop only PID-tracked processes from our logs
stop_tracked_processes() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(dirname "$script_dir")"
    local logs_dir="$project_root/logs"
    
    log "Stopping tracked processes from PID files..."
    
    # Stop backend if PID file exists
    if [ -f "$logs_dir/backend.pid" ]; then
        local backend_pid=$(cat "$logs_dir/backend.pid" 2>/dev/null || true)
        if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
            log "Stopping tracked backend process (PID: $backend_pid)"
            kill -TERM "$backend_pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$backend_pid" 2>/dev/null; then
                warning "Force killing backend process"
                kill -KILL "$backend_pid" 2>/dev/null || true
            fi
            rm -f "$logs_dir/backend.pid"
            success "Backend process stopped"
        else
            log "Backend PID file exists but process not running"
            rm -f "$logs_dir/backend.pid"
        fi
    fi
    
    # Stop frontend if PID file exists
    if [ -f "$logs_dir/frontend.pid" ]; then
        local frontend_pid=$(cat "$logs_dir/frontend.pid" 2>/dev/null || true)
        if [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
            log "Stopping tracked frontend process (PID: $frontend_pid)"
            kill -TERM "$frontend_pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$frontend_pid" 2>/dev/null; then
                warning "Force killing frontend process"
                kill -KILL "$frontend_pid" 2>/dev/null || true
            fi
            rm -f "$logs_dir/frontend.pid"
            success "Frontend process stopped"
        else
            log "Frontend PID file exists but process not running"
            rm -f "$logs_dir/frontend.pid"
        fi
    fi
}

# Function to stop application processes - ONLY port-based killing now
stop_app_processes() {
    log "Stopping application processes (port-based only)..."
    
    # First try to stop tracked processes cleanly
    stop_tracked_processes
    
    # Stop PM2 processes (only our specific ones)
    stop_pm2_processes
    
    # Note: We no longer kill by pattern to avoid affecting other services
    # Port-specific killing is handled in the main scripts
    
    success "Application processes stop sequence completed"
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
        tracked)
            stop_tracked_processes
            ;;
        all)
            stop_app_processes
            ;;
        *)
            echo "Usage: $0 {pattern|pm2|tracked|all} [options]"
            echo ""
            echo "Commands:"
            echo "  pattern <pattern> [name]  Kill processes matching pattern"
            echo "  pm2                       Stop specific PM2 processes"
            echo "  tracked                   Stop processes tracked in PID files"
            echo "  all                       Stop application processes (safe mode)"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
