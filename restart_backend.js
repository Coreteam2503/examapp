const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting backend with quiz generation fix...');

// Function to kill process on port
function killPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            console.log(`Killing process ${pid} on port ${port}`);
            exec(`taskkill /PID ${pid} /F`, () => {});
          }
        });
      }
      setTimeout(resolve, 1000);
    });
  });
}

// Function to kill by PID file
function killByPidFile() {
  const pidFile = path.join(__dirname, 'logs', 'backend.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const pid = fs.readFileSync(pidFile, 'utf8').trim();
      console.log(`Killing tracked PID: ${pid}`);
      exec(`taskkill /PID ${pid} /F`, () => {});
      fs.unlinkSync(pidFile);
    } catch (e) {
      console.log('Error reading PID file:', e.message);
    }
  }
}

// Main restart function
async function restart() {
  try {
    // Kill existing processes
    killByPidFile();
    await killPort(8000);
    
    console.log('✅ Old processes stopped');
    console.log('🚀 Starting backend with fallback quiz generator...');
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Start new backend process
    const backendDir = path.join(__dirname, 'backend');
    const child = spawn('node', ['src/server.js'], {
      cwd: backendDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Write PID file
    fs.writeFileSync(path.join(logsDir, 'backend.pid'), child.pid.toString());
    
    // Set up logging
    const logStream = fs.createWriteStream(path.join(logsDir, 'backend.log'), { flags: 'a' });
    const errorStream = fs.createWriteStream(path.join(logsDir, 'backend_error.log'), { flags: 'a' });
    
    child.stdout.pipe(logStream);
    child.stderr.pipe(errorStream);
    
    console.log(`✅ Backend restarted with PID: ${child.pid}`);
    console.log('🌐 Backend API: http://localhost:8000/api');
    console.log('🏥 Health Check: http://localhost:8000/api/health');
    console.log('📝 Check logs/backend.log for startup messages');
    
    // Wait a bit and check if it started successfully
    setTimeout(() => {
      const http = require('http');
      const req = http.get('http://localhost:8000/api/health', (res) => {
        console.log('✅ Backend is responding to health checks');
        process.exit(0);
      });
      
      req.on('error', () => {
        console.log('⚠️  Backend may still be starting up...');
        process.exit(0);
      });
      
      req.setTimeout(5000, () => {
        console.log('⚠️  Backend taking longer than expected to start');
        process.exit(0);
      });
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error restarting backend:', error);
    process.exit(1);
  }
}

restart();