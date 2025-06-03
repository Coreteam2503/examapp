#!/bin/bash
# Force restart backend (for Git Bash/WSL)
echo "🔄 Force restarting backend..."

# Kill processes on port 8000
echo "Killing processes on port 8000..."
npx kill-port 8000 2>/dev/null || true

# Kill by PID file
if [ -f "logs/backend.pid" ]; then
    PID=$(cat logs/backend.pid)
    echo "Killing PID: $PID"
    kill -9 $PID 2>/dev/null || true
    rm logs/backend.pid
fi

# Start backend
echo "Starting backend with fallback quiz generator..."
cd backend
nohup node src/server.js > ../logs/backend.log 2> ../logs/backend_error.log &
echo $! > ../logs/backend.pid

echo "✅ Backend restarted!"
echo "🌐 Backend API: http://localhost:8000/api"
echo "🏥 Health Check: http://localhost:8000/api/health"