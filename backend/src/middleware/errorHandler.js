const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'quiz-app-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (stack) {
          log += `\n${stack}`;
        }
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });

  // Log request body for POST/PUT (but sanitize sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.confirmPassword;
    
    logger.info('Request body', {
      url: req.url,
      body: sanitizedBody
    });
  }

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      success: res.statusCode < 400
    });

    // Log error responses with more detail
    if (res.statusCode >= 400) {
      logger.error('Error response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.userId,
        responseData: data
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

// Game generation specific error handler
const gameGenerationErrorHandler = (error, req, res, next) => {
  logger.error('Game generation error', {
    error: error.message,
    stack: error.stack,
    uploadId: req.body?.uploadId,
    gameFormat: req.body?.gameFormat,
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });

  // Check for specific error types
  if (error.message.includes('OPENAI_API_KEY')) {
    return res.status(500).json({
      success: false,
      error: 'AI service configuration error',
      message: 'Game generation service is temporarily unavailable. Using fallback generation.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service configuration issue'
    });
  }

  if (error.message.includes('Upload not found')) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'The uploaded file could not be found or accessed.',
      details: 'Please ensure the file exists and you have permission to access it.'
    });
  }

  if (error.message.includes('JSON')) {
    return res.status(500).json({
      success: false,
      error: 'Data processing error',
      message: 'Failed to process game generation response.',
      details: 'The AI service returned invalid data. Using fallback generation.'
    });
  }

  // Default game generation error
  res.status(500).json({
    success: false,
    error: 'Game generation failed',
    message: 'Failed to generate game content. Please try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// Centralized error handling middleware
const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  
  // Validation errors (Joi)
  if (error.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Invalid request data',
      details: error.details.map(detail => detail.message)
    });
  }

  // Database errors
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.errno === 19) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Duplicate data detected'
    });
  }

  if (error.code?.startsWith('SQLITE_') || error.errno) {
    logger.error('Database error', {
      code: error.code,
      errno: error.errno,
      message: error.message,
      sql: error.sql
    });
    
    return res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'A database error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      message: 'Invalid or expired token',
      details: 'Please log in again'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Your session has expired',
      details: 'Please log in again'
    });
  }

  // Multer file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
      details: `Maximum file size is ${process.env.MAX_FILE_SIZE_KB || 10}MB`
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'Too many files',
      message: 'Too many files uploaded at once',
      details: 'Please upload fewer files'
    });
  }

  // Rate limiting errors
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request too large',
      message: 'The request body is too large',
      details: 'Please send smaller requests'
    });
  }

  // Network/timeout errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'External service is temporarily unavailable',
      details: 'Please try again in a moment'
    });
  }

  // OpenAI/API errors
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({
      success: false,
      error: 'External API error',
      message: 'External service returned an error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'External service error'
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  
  res.status(statusCode).json({
    success: false,
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.stack : 'Please try again or contact support if the problem persists',
    timestamp: new Date().toISOString(),
    requestId: req.id // If you add request ID middleware
  });
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
    details: 'The requested endpoint does not exist'
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check with error logging test
const healthCheck = async (req, res) => {
  try {
    // Test database connection
    const { testConnection } = require('../config/database');
    const dbStatus = await testConnection();
    
    // Test logger
    logger.info('Health check performed', {
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      logging: 'operational',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorHandler,
  gameGenerationErrorHandler,
  notFoundHandler,
  asyncHandler,
  healthCheck
};
