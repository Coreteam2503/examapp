// Auto-restart trigger - Adding debug route
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');

// Import security middleware
const { securityConfig, requestLogger, additionalSecurityHeaders } = require('./middleware/security');
const { generalApiLimiter, authLimiter, quizGenerationLimiter } = require('./middleware/rateLimiting');

const app = express();
const PORT = process.env.PORT || 8000;

// Security Middleware
app.use(securityConfig()); // Enhanced helmet configuration
app.use(additionalSecurityHeaders); // Additional security headers
app.use(requestLogger); // Request logging
// Note: General rate limiting applied per route, not globally

// CORS configuration with debugging
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('CORS allowed origins:', corsOptions.origin);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger to see ALL incoming requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Debug endpoint to test basic functionality
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    routes_loaded: {
      task_34: 'Advanced Role Management',
      task_35: 'Points and Scoring System'
    }
  });
});

// Routes with specific rate limiting
try {
  app.use('/api/auth', require('./routes/auth')); // Auth route
  app.use('/api/uploads', require('./routes/uploads')); // Uploads route
  app.use('/api/quizzes', require('./routes/quizzes')); // Quizzes route
  app.use('/api/quiz-attempts', require('./routes/quizAttempts')); // submit quiz answers
  app.use('/api/users', require('./routes/users')); // Users route
  app.use('/api/analytics', require('./routes/analytics')); // Analytics route
  app.use('/api/admin', require('./routes/admin')); // Admin route
  
  console.log('Loading batch routes...');
  app.use('/api/batches', require('./routes/batches')); // Batch management routes
  console.log('Batch routes loaded successfully');
  
  console.log('Loading simplified roles route...');
  app.use('/api/roles', require('./routes/roles-simple')); // Role management (simplified)
  console.log('Simplified roles route loaded successfully');
  
  console.log('Loading simplified points route...');
  app.use('/api/points', require('./routes/points-simple')); // Points system (simplified)
  console.log('Simplified points route loaded successfully');
  
  console.log('Loading games route...');
  app.use('/api/games', require('./routes/games')); // Game formats
  console.log('Games route loaded successfully');
  
  console.log('Loading questions route...');
  app.use('/api/questions', require('./routes/questions')); // Question bank APIs
  console.log('Questions route loaded successfully');
  
} catch (error) {
  console.error('Error loading routes:', error);
}

// AI routes (rate limiting applied per endpoint in routes/ai.js)
app.use('/api/ai', require('./routes/ai')); // Rate limiting applied to specific endpoints

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running now',
    timestamp: new Date().toISOString()
  });
});

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, '../../frontend')));
  
  // Fallback route for React Router (SPA support)
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API route not found'
      });
    }
    res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
  });
} else {
  // Development mode - simple root route
  app.get('/', (req, res) => {
    res.send('<h1>Backend API running locally</h1><p>Environment: Development</p><p>API available at <a href="/api/health">/api/health</a></p>');
  });
}

// 404 handler (only for non-production or when not handled above)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  console.error('Error stack:', error.stack);
  
  // Handle rate limiting errors
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  // Handle game generation errors specifically
  if (error.message && error.message.includes('game')) {
    return res.status(500).json({
      success: false,
      error: 'Game generation failed',
      message: 'Failed to generate game content. Using fallback generation.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Server error occurred'
    });
  }
  
  // Handle other specific errors
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      message: error.message || 'Request failed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize AI Service
console.log('Initializing AI Service...');
console.log('API Key present:', !!process.env.OPENAI_API_KEY ? 'Yes' : 'No');

// Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔧 Debug endpoint: http://localhost:${PORT}/api/debug`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
