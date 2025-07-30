/**
 * Simple console logger for development
 * Fallback when winston is not available
 */

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }
};

module.exports = logger;
