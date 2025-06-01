#!/bin/bash

# Port Management Utility
# Handles killing processes on specific ports

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[PORT]${NC} $1"
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

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service_name=${2:-"Service"}
    
    log "Cleaning up port $port ($service_name)..."
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log "Found processes on port $port: $pids"
        
        # Graceful termination
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            warning "Force killing processes on port $port"
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
            sleep 1
        fi
        
        # Final verification
        local final_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$final_pids" ]; then
            error "Failed to kill processes on port $port"
            return 1
        else
            success "Port $port is now free"
        fi
    else
        log "Port $port is already free"
    fi
    
    return 0
}

# Function to check if port is available
is_port_free() {
    local port=$1
    ! lsof -ti:$port >/dev/null 2>&1
}

# Function to wait for port to be free
wait_for_port_free() {
    local port=$1
    local max_wait=${2:-10}
    local count=0
    
    while ! is_port_free $port && [ $count -lt $max_wait ]; do
        log "Waiting for port $port to be free... ($count/$max_wait)"
        sleep 1
        ((count++))
    done
    
    if [ $count -eq $max_wait ]; then
        error "Port $port is still in use after ${max_wait}s"
        return 1
    fi
    
    return 0
}

# Main function when script is called directly
main() {
    case "$1" in
        kill)
            if [ -z "$2" ]; then
                echo "Usage: $0 kill <port> [service_name]"
                exit 1
            fi
            kill_port "$2" "$3"
            ;;
        check)
            if [ -z "$2" ]; then
                echo "Usage: $0 check <port>"
                exit 1
            fi
            if is_port_free "$2"; then
                success "Port $2 is free"
            else
                warning "Port $2 is in use"
                lsof -ti:$2 2>/dev/null || true
            fi
            ;;
        wait)
            if [ -z "$2" ]; then
                echo "Usage: $0 wait <port> [timeout]"
                exit 1
            fi
            wait_for_port_free "$2" "$3"
            ;;
        *)
            echo "Usage: $0 {kill|check|wait} <port> [options]"
            echo ""
            echo "Commands:"
            echo "  kill <port> [name]     Kill processes on port"
            echo "  check <port>           Check if port is free"
            echo "  wait <port> [timeout]  Wait for port to be free"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
