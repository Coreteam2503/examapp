#!/bin/bash

# Agentic Mesh Quiz App - Restart Script
# Stops existing processes and starts the application

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
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Default environment
ENVIRONMENT=${NODE_ENV:-development}
SKIP_DEPS="false"

log() {
    echo -e "${BLUE}[RESTART]${NC} $1"
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

# Source utility scripts
source "$SCRIPT_DIR/port_manager.sh"
source "$SCRIPT_DIR/process_manager.sh"
source "$SCRIPT_DIR/health_checker.sh"
source "$SCRIPT_DIR/service_starter.sh"
source "$SCRIPT_DIR/deps_manager.sh"

# Function to initialize database
initialize_database() {
    header "=== Initializing Database ==="
    
    cd "$BACKEND_DIR"
    
    if [ -f "init-db.js" ]; then
        log "Running database initialization..."
        node init-db.js
        success "Database initialized"
    else
        warning "Database initialization script not found"
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to display final status
show_final_status() {
    header "=== Application Status ==="
    
    echo ""
    log "🚀 Agentic Mesh Quiz App is now running!"
    echo ""
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:8000/api"
    echo -e "${GREEN}Health Check:${NC} http://localhost:8000/api/health"
    echo ""
    
    # Show running processes
    local backend_pid=$(lsof -ti:8000 2>/dev/null || echo "Not found")
    local frontend_pid=$(lsof -ti:3000 2>/dev/null || echo "Not found")
    
    echo -e "${BLUE}Process Information:${NC}"
    echo "  Backend PID: $backend_pid"
    echo "  Frontend PID: $frontend_pid"
    echo ""
    
    # Show logs location
    echo -e "${BLUE}Logs Location:${NC} $PROJECT_ROOT/logs/"
    echo "  Backend: $PROJECT_ROOT/logs/backend.log"
    echo "  Frontend: $PROJECT_ROOT/logs/frontend.log"
    echo ""
    
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  Stop app: ./deployment_scripts/stop.sh"
    echo "  Check status: ./deployment_scripts/status.sh"
    echo "  View logs: tail -f logs/backend.log"
    echo ""
}

# Main restart function
main() {
    header "=== Agentic Mesh Quiz App - Restart Script ==="
    log "Environment: $ENVIRONMENT"
    log "Project Root: $PROJECT_ROOT"
    echo ""
    
    # Step 1: Stop all existing processes
    header "=== Step 1: Stopping Existing Processes ==="
    stop_app_processes
    kill_port 3000 "Frontend"
    kill_port 8000 "Backend"
    success "All processes stopped"
    
    # Step 2: Install dependencies (unless skipped)
    if [ "$SKIP_DEPS" != "true" ]; then
        install_both
    else
        log "Skipping dependency installation"
    fi
    
    # Step 3: Initialize database
    initialize_database
    
    # Step 4: Start services
    start_both "$ENVIRONMENT"
    
    # Step 5: Wait for services to be ready
    header "=== Step 5: Verifying Services ==="
    sleep 5  # Give services time to start
    
    wait_for_service "http://localhost:8000/api/health" "Backend API" 30
    wait_for_service "http://localhost:3000" "Frontend App" 30
    
    success "All services are running"
    
    # Step 6: Show final status
    show_final_status
    
    success "Restart completed successfully!"
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            export NODE_ENV=production
            ENVIRONMENT=production
            shift
            ;;
        --development)
            export NODE_ENV=development
            ENVIRONMENT=development
            shift
            ;;
        --skip-deps)
            SKIP_DEPS="true"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --production     Start in production mode"
            echo "  --development    Start in development mode (default)"
            echo "  --skip-deps      Skip dependency installation"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "This script will:"
            echo "  1. Stop all existing processes on ports 3000 and 8000"
            echo "  2. Install dependencies (unless --skip-deps)"
            echo "  3. Initialize the database"
            echo "  4. Start backend and frontend servers"
            echo "  5. Verify services are running"
            echo ""
            echo "Examples:"
            echo "  $0                    # Start in development mode"
            echo "  $0 --production       # Start in production mode"
            echo "  $0 --skip-deps        # Skip dependency installation"
            exit 0
            ;;
        *)
            warning "Unknown option: $1"
            echo "Use --help for usage information"
            shift
            ;;
    esac
done

# Run main function
main
