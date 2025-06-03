# Windows Deployment Scripts

This directory contains Windows PowerShell scripts for managing the Agentic Mesh Quiz App deployment on Windows systems.

## Prerequisites

- Windows 10/11 with PowerShell 5.1 or later
- Node.js and npm installed
- Git (optional, for version control)

## Quick Start

### Option 1: Using Batch Files (Easiest)
```cmd
# Start the application
.\deployment_scripts\restart.bat

# Start specific services
.\deployment_scripts\service_starter.bat both development
```

### Option 2: Using PowerShell Directly
```powershell
# Start the application
.\deployment_scripts\restart.ps1

# Start in production mode
.\deployment_scripts\restart.ps1 -Production

# Skip dependency installation
.\deployment_scripts\restart.ps1 -SkipDeps
```

## Available Scripts

### Main Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `restart.ps1` | Complete restart of the application | `.\restart.ps1 [-Production] [-Development] [-SkipDeps] [-Help]` |
| `service_starter.ps1` | Start individual or both services | `.\service_starter.ps1 {backend\|frontend\|both} [environment]` |
| `stop.ps1` | Stop all application services | `.\stop.ps1` |
| `status.ps1` | Check application status | `.\status.ps1` |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `port_manager.ps1` | Manage processes on specific ports | `.\port_manager.ps1 {kill\|check\|wait} <port>` |
| `process_manager.ps1` | Manage application processes | `.\process_manager.ps1 {pattern\|pm2\|tracked\|all}` |
| `health_checker.ps1` | Check service health | `.\health_checker.ps1 {wait\|check\|status\|all}` |
| `deps_manager.ps1` | Manage dependencies | `.\deps_manager.ps1 {check\|backend\|frontend\|both\|clean}` |

### Batch File Wrappers

| Script | Purpose |
|--------|---------|
| `restart.bat` | Batch wrapper for restart.ps1 |
| `service_starter.bat` | Batch wrapper for service_starter.ps1 |

## Usage Examples

### Starting the Application

```powershell
# Development mode (default)
.\deployment_scripts\restart.ps1

# Production mode
.\deployment_scripts\restart.ps1 -Production

# Skip dependency installation
.\deployment_scripts\restart.ps1 -SkipDeps
```

### Starting Individual Services

```powershell
# Start both services in development
.\deployment_scripts\service_starter.ps1 both development

# Start only backend in production
.\deployment_scripts\service_starter.ps1 backend production

# Start only frontend
.\deployment_scripts\service_starter.ps1 frontend
```

### Managing Dependencies

```powershell
# Install all dependencies
.\deployment_scripts\deps_manager.ps1 both

# Install only backend dependencies
.\deployment_scripts\deps_manager.ps1 backend

# Clean all dependencies
.\deployment_scripts\deps_manager.ps1 clean
```

### Checking Status

```powershell
# Check all services
.\deployment_scripts\status.ps1

# Check specific service health
.\deployment_scripts\health_checker.ps1 check "http://localhost:8000/api/health" "Backend API"
```

### Port Management

```powershell
# Kill process on port 3000
.\deployment_scripts\port_manager.ps1 kill 3000

# Check if port 8000 is free
.\deployment_scripts\port_manager.ps1 check 8000

# Wait for port to be free
.\deployment_scripts\port_manager.ps1 wait 3000 30
```

## PowerShell Execution Policy

If you encounter execution policy errors, you can temporarily bypass them:

```powershell
# Run with bypass policy
powershell -ExecutionPolicy Bypass -File ".\deployment_scripts\restart.ps1"

# Or set policy for current user (permanent)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Logging

- Logs are stored in the `logs/` directory
- Backend logs: `logs/backend.log`
- Frontend logs: `logs/frontend.log`
- Process IDs are tracked in: `logs/backend.pid` and `logs/frontend.pid`

### Viewing Logs

```powershell
# View last 20 lines of backend log
Get-Content logs\backend.log -Tail 20

# Follow backend log in real-time
Get-Content logs\backend.log -Tail 20 -Wait

# View frontend log
Get-Content logs\frontend.log -Tail 20
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```powershell
   .\deployment_scripts\port_manager.ps1 kill 3000
   .\deployment_scripts\port_manager.ps1 kill 8000
   ```

2. **Dependencies Not Installed**
   ```powershell
   .\deployment_scripts\deps_manager.ps1 clean
   .\deployment_scripts\deps_manager.ps1 both
   ```

3. **Services Not Starting**
   ```powershell
   .\deployment_scripts\status.ps1
   Get-Content logs\backend.log -Tail 50
   ```

4. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Environment Variables

The scripts respect the following environment variables:
- `NODE_ENV` - Sets the default environment (development/production)

### Process Management

The scripts use several methods to manage processes:
1. **PID Files** - Track processes using PID files in the logs directory
2. **Port-based Killing** - Kill processes by the ports they're using
3. **Graceful Shutdown** - Attempt graceful shutdown before force killing

## Differences from Linux Scripts

- Uses PowerShell instead of Bash
- Uses `Get-NetTCPConnection` instead of `lsof` for port checking
- Uses `Start-Process` for launching services
- Uses Windows-style path separators
- Includes batch file wrappers for easier execution

## Security Considerations

- Scripts use `Start-Process` with hidden windows to run services in background
- PID files are used to track processes for clean shutdown
- Only kills processes on specific ports (3000, 8000) to avoid affecting other services
- Graceful shutdown is attempted before force killing processes
