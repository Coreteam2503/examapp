#!/bin/bash

# Service Health Checker
# Checks if services are running and responding

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[HEALTH]${NC} $1"
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

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_wait=${3:-30}
    local count=0
    
    log "Waiting for $service_name to be ready..."
    
    while [ $count -lt $max_wait ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            success "$service_name is ready!"
            return 0
        fi
        sleep 2
        ((count+=2))
        echo -n "."
    done
    
    echo ""
    warning "$service_name not ready after ${max_wait}s"
    return 1
}

# Function to check if service is responding
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        success "$service_name is responding"
        return 0
    else
        error "$service_name is not responding"
        return 1
    fi
}

# Function to get service status
get_service_status() {
    local port=$1
    local service_name=$2
    local url=$3
    
    local pid=$(lsof -ti:$port 2>/dev/null || echo "")
    
    if [ -n "$pid" ]; then
        if curl -s "$url" >/dev/null 2>&1; then
            success "$service_name is running (PID: $pid) ✅"
            return 0
        else
            warning "$service_name process found but not responding (PID: $pid) ⚠️"
            return 1
        fi
    else
        error "$service_name is not running ❌"
        return 1
    fi
}

# Function to check all application services
check_all_services() {
    log "Checking all services..."
    
    local backend_ok=0
    local frontend_ok=0
    
    echo ""
    echo "🔧 Backend Service (Port 8000):"
    if get_service_status 8000 "Backend API" "http://localhost:8000/api/health"; then
        backend_ok=1
    fi
    
    echo ""
    echo "🌐 Frontend Service (Port 3000):"
    if get_service_status 3000 "Frontend App" "http://localhost:3000"; then
        frontend_ok=1
    fi
    
    echo ""
    if [ $backend_ok -eq 1 ] && [ $frontend_ok -eq 1 ]; then
        success "All services are running properly"
        return 0
    else
        warning "Some services are not running properly"
        return 1
    fi
}

# Main function when script is called directly
main() {
    case "$1" in
        wait)
            if [ -z "$2" ] || [ -z "$3" ]; then
                echo "Usage: $0 wait <url> <service_name> [timeout]"
                exit 1
            fi
            wait_for_service "$2" "$3" "$4"
            ;;
        check)
            if [ -z "$2" ] || [ -z "$3" ]; then
                echo "Usage: $0 check <url> <service_name>"
                exit 1
            fi
            check_service "$2" "$3"
            ;;
        status)
            if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
                echo "Usage: $0 status <port> <service_name> <url>"
                exit 1
            fi
            get_service_status "$2" "$3" "$4"
            ;;
        all)
            check_all_services
            ;;
        *)
            echo "Usage: $0 {wait|check|status|all} [options]"
            echo ""
            echo "Commands:"
            echo "  wait <url> <name> [timeout]  Wait for service to be ready"
            echo "  check <url> <name>           Check if service responds"
            echo "  status <port> <name> <url>   Get service status"
            echo "  all                          Check all application services"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
