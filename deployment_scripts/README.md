# Deployment Scripts

This directory contains deployment and management scripts for the Agentic Mesh Quiz App, following the Single Responsibility Principle (SRP).

## Main Scripts

### 🚀 `restart.sh`
**Primary deployment script** - Stops existing processes and starts the application.

```bash
# Development mode (default)
./deployment_scripts/restart.sh

# Production mode
./deployment_scripts/restart.sh --production

# Skip dependency installation (faster restart)
./deployment_scripts/restart.sh --skip-deps

# Help
./deployment_scripts/restart.sh --help
```

**What it does:**
1. Stops all existing processes on ports 3000 and 8000
2. Installs dependencies (unless `--skip-deps`)
3. Initializes the database
4. Starts backend and frontend servers
5. Verifies services are running

### 🛑 `stop.sh`
**Emergency stop script** - Stops all application processes and frees ports.

```bash
./deployment_scripts/stop.sh
```

**What it does:**
- Stops all application-specific processes
- Frees ports 3000 and 8000
- Cleans up PM2 processes if any

### 📊 `status.sh`
**Status checker** - Shows current application status.

```bash
./deployment_scripts/status.sh
```

**What it shows:**
- Service status (running/stopped)
- Process IDs
- Recent log entries
- Available commands

## Utility Scripts (SRP Components)

### 🔌 `port_manager.sh`
Manages port-related operations.

```bash
# Kill processes on a port
./deployment_scripts/port_manager.sh kill 3000 "Frontend"

# Check if port is free
./deployment_scripts/port_manager.sh check 8000

# Wait for port to be free
./deployment_scripts/port_manager.sh wait 3000 30
```

### ⚙️ `process_manager.sh`
Manages application processes.

```bash
# Stop processes by pattern
./deployment_scripts/process_manager.sh pattern "react-scripts start"

# Stop PM2 processes
./deployment_scripts/process_manager.sh pm2

# Stop all app processes
./deployment_scripts/process_manager.sh all
```

### 🏥 `health_checker.sh`
Checks service health and responsiveness.

```bash
# Wait for service to be ready
./deployment_scripts/health_checker.sh wait "http://localhost:8000/api/health" "Backend API" 30

# Check if service responds
./deployment_scripts/health_checker.sh check "http://localhost:3000" "Frontend"

# Check all services
./deployment_scripts/health_checker.sh all
```

### 🚀 `service_starter.sh`
Starts application services.

```bash
# Start backend only
./deployment_scripts/service_starter.sh backend development

# Start frontend only
./deployment_scripts/service_starter.sh frontend production

# Start both services
./deployment_scripts/service_starter.sh both development
```

### 📦 `deps_manager.sh`
Manages project dependencies.

```bash
# Check prerequisites
./deployment_scripts/deps_manager.sh check

# Install backend dependencies
./deployment_scripts/deps_manager.sh backend

# Install frontend dependencies
./deployment_scripts/deps_manager.sh frontend

# Install all dependencies
./deployment_scripts/deps_manager.sh both

# Clean all dependencies
./deployment_scripts/deps_manager.sh clean
```

## Usage Examples

### Quick Start
```bash
# First time setup
./deployment_scripts/restart.sh

# Subsequent restarts (faster)
./deployment_scripts/restart.sh --skip-deps
```

### Development Workflow
```bash
# Start development
./deployment_scripts/restart.sh --development

# Check status
./deployment_scripts/status.sh

# Stop when done
./deployment_scripts/stop.sh
```

### Production Deployment
```bash
# Deploy to production
./deployment_scripts/restart.sh --production

# Check everything is running
./deployment_scripts/status.sh
```

### Troubleshooting
```bash
# Force stop everything
./deployment_scripts/stop.sh

# Check what's running on ports
./deployment_scripts/port_manager.sh check 3000
./deployment_scripts/port_manager.sh check 8000

# Clean and reinstall dependencies
./deployment_scripts/deps_manager.sh clean
./deployment_scripts/deps_manager.sh both

# Restart
./deployment_scripts/restart.sh
```

## Environment Variables

The scripts respect these environment variables:

- `NODE_ENV`: Set to `production` or `development` (default: `development`)
- `REACT_APP_API_URL`: Frontend API URL (default: `http://localhost:8000/api`)
- `JWT_SECRET`: Backend JWT secret
- `OPENAI_API_KEY`: OpenAI API key for future use

## Files Created

The scripts create these files during operation:

```
logs/
├── backend.log      # Backend service logs
├── frontend.log     # Frontend service logs
├── backend.pid      # Backend process ID
└── frontend.pid     # Frontend process ID
```

## Server Deployment

These scripts are designed to work on both local development and production servers. For production:

1. Copy the entire `deployment_scripts/` directory to your server
2. Ensure Node.js and npm are installed
3. Set environment variables appropriately
4. Run `./deployment_scripts/restart.sh --production`

## Dependencies

Required tools:
- **Node.js** and **npm** (mandatory)
- **lsof** (for port management)
- **curl** (for health checks)
- **serve** (optional, for production frontend)
- **nodemon** (optional, for development)
- **PM2** (optional, for production process management)

## Features

✅ **Aggressive port cleanup** - Ensures ports are always freed before starting
✅ **Health checking** - Verifies services are responding
✅ **Environment support** - Development and production modes
✅ **Dependency management** - Smart dependency installation
✅ **Logging** - Comprehensive logging with timestamps
✅ **Modular design** - Small, focused utility scripts
✅ **Error handling** - Graceful error handling and recovery
✅ **Help documentation** - Built-in help for all scripts

## Architecture

The scripts follow the **Single Responsibility Principle**:

- **Main scripts** (`restart.sh`, `stop.sh`, `status.sh`) orchestrate operations
- **Utility scripts** handle specific concerns (ports, processes, health, etc.)
- **Shared functionality** through script sourcing
- **Clear separation** of concerns for maintainability

This modular approach makes the scripts:
- Easy to test individual components
- Simple to modify specific functionality
- Reusable across different deployment scenarios
- Clear and understandable code structure
