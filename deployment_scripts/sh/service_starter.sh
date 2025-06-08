#!/bin/bash

# ./Users/balajiv/Documents/coderepos/futureOS/examApp/deployment_scripts/sh/start.sh

# Service Starter with Pre-Cleanup
# Stops any process using ports 3000 and 8000 before starting backend and frontend services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

log() {
    echo -e "${BLUE}[STARTER]${NC} $1"
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

header() {
    echo -e "${PURPLE}$1${NC}"
}

# Kill process running on a given port
kill_port() {
    local port=$1
    local pid

    pid=$(lsof -ti :"$port")
    if [ -n "$pid" ]; then
        warning "Port $port is in use by PID(s): $pid. Terminating..."
        kill -9 $pid
        success "Port $port has been freed."
    else
        log "Port $port is free."
    fi
}

# Stop processes using common ports
cleanup_ports() {
    header "=== Stopping Processes on Ports 3000 and 8000 ==="
    kill_port 3000
    kill_port 8000
}

# Function to start backend
start_backend() {
    local environment=${1:-development}

    header "=== Starting Backend Server ==="

    cd "$BACKEND_DIR"

    # Create logs directory
    mkdir -p ../logs

    if [ "$environment" = "production" ]; then
        log "Starting backend in production mode..."
        NODE_ENV=production nohup node src/server.js > ../logs/backend.log 2>&1 &
        echo $! > ../logs/backend.pid
        success "Backend started in production mode (PID: $(cat ../logs/backend.pid))"
    else
        log "Starting backend in development mode..."
        if command -v nodemon >/dev/null 2>&1; then
            nodemon src/server.js > ../logs/backend.log 2>&1 &
        else
            node src/server.js > ../logs/backend.log 2>&1 &
        fi
        echo $! > ../logs/backend.pid
        success "Backend started in development mode (PID: $(cat ../logs/backend.pid))"
    fi

    cd "$PROJECT_ROOT"
}

# Function to start frontend
start_frontend() {
    local environment=${1:-development}

    header "=== Starting Frontend Server ==="

    cd "$FRONTEND_DIR"

    # Create logs directory
    mkdir -p ../logs

    if [ "$environment" = "production" ]; then
        # Build for production if needed
        if [ ! -d "build" ]; then
            log "Building frontend for production..."
            npm run build
        fi

        log "Starting frontend in production mode..."
        if command -v serve >/dev/null 2>&1; then
            nohup serve -s build -l 3000 > ../logs/frontend.log 2>&1 &
            echo $! > ../logs/frontend.pid
            success "Frontend started in production mode (PID: $(cat ../logs/frontend.pid))"
        else
            warning "Install 'serve' package for production: npm install -g serve"
            log "Starting with npm start instead..."
            npm start > ../logs/frontend.log 2>&1 &
            echo $! > ../logs/frontend.pid
            success "Frontend started with npm start (PID: $(cat ../logs/frontend.pid))"
        fi
    else
        log "Starting frontend in development mode..."
        npm start > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        success "Frontend started in development mode (PID: $(cat ../logs/frontend.pid))"
    fi

    cd "$PROJECT_ROOT"
}

# Function to start both services
start_both() {
    local environment=${1:-development}

    log "Starting both services in $environment mode..."

    start_backend "$environment"
    sleep 3  # Give backend time to start
    start_frontend "$environment"

    success "Both services started"
}

# Main function when script is called directly
main() {
    # First: Kill processes using common ports
    cleanup_ports

    local environment=${NODE_ENV:-development}

    case "$1" in
        backend)
            environment=${2:-$environment}
            start_backend "$environment"
            ;;
        frontend)
            environment=${2:-$environment}
            start_frontend "$environment"
            ;;
        both)
            environment=${2:-$environment}
            start_both "$environment"
            ;;
        *)
            echo "Usage: $0 {backend|frontend|both} [environment]"
            echo ""
            echo "Commands:"
            echo "  backend [env]     Start backend service"
            echo "  frontend [env]    Start frontend service"
            echo "  both [env]        Start both services"
            echo ""
            echo "Environment:"
            echo "  development (default)"
            echo "  production"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi