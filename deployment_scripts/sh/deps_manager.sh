#!/bin/bash

# Dependencies Manager
# Handles installation of project dependencies

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
    echo -e "${BLUE}[DEPS]${NC} $1"
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

# Function to check prerequisites
check_prerequisites() {
    header "=== Checking Prerequisites ==="
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js is not installed"
        exit 1
    fi
    log "Node.js version: $(node --version)"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        error "npm is not installed"
        exit 1
    fi
    log "npm version: $(npm --version)"
    
    # Check project directories
    if [ ! -d "$BACKEND_DIR" ]; then
        error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Function to install backend dependencies
install_backend() {
    header "=== Installing Backend Dependencies ==="
    
    cd "$BACKEND_DIR"
    
    if [ ! -f "package.json" ]; then
        error "Backend package.json not found"
        exit 1
    fi
    
    log "Installing backend dependencies..."
    npm install
    success "Backend dependencies installed"
    
    cd "$PROJECT_ROOT"
}

# Function to install frontend dependencies
install_frontend() {
    header "=== Installing Frontend Dependencies ==="
    
    cd "$FRONTEND_DIR"
    
    if [ ! -f "package.json" ]; then
        error "Frontend package.json not found"
        exit 1
    fi
    
    log "Installing frontend dependencies..."
    npm install
    success "Frontend dependencies installed"
    
    cd "$PROJECT_ROOT"
}

# Function to install both
install_both() {
    check_prerequisites
    install_backend
    install_frontend
    success "All dependencies installed"
}

# Function to clean dependencies
clean_dependencies() {
    header "=== Cleaning Dependencies ==="
    
    log "Removing node_modules directories..."
    rm -rf "$BACKEND_DIR/node_modules" 2>/dev/null || true
    rm -rf "$FRONTEND_DIR/node_modules" 2>/dev/null || true
    
    log "Removing package-lock.json files..."
    rm -f "$BACKEND_DIR/package-lock.json" 2>/dev/null || true
    rm -f "$FRONTEND_DIR/package-lock.json" 2>/dev/null || true
    
    success "Dependencies cleaned"
}

# Main function when script is called directly
main() {
    case "$1" in
        check)
            check_prerequisites
            ;;
        backend)
            check_prerequisites
            install_backend
            ;;
        frontend)
            check_prerequisites
            install_frontend
            ;;
        both|all)
            install_both
            ;;
        clean)
            clean_dependencies
            ;;
        *)
            echo "Usage: $0 {check|backend|frontend|both|clean}"
            echo ""
            echo "Commands:"
            echo "  check        Check prerequisites"
            echo "  backend      Install backend dependencies"
            echo "  frontend     Install frontend dependencies"
            echo "  both         Install all dependencies"
            echo "  clean        Remove all dependencies"
            exit 1
            ;;
    esac
}

# Only run main if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
