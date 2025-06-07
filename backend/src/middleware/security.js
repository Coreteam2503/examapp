const helmet = require('helmet');

// Enhanced security configuration
const securityConfig = () => {
  // Basic helmet configuration with enhanced settings
  const helmetConfig = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Frame-Options
    frameguard: {
      action: 'deny'
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    
    // X-XSS-Protection (deprecated but still useful for older browsers)
    xssFilter: true,
    
    // Hide X-Powered-By header
    hidePoweredBy: true
  });

  return helmetConfig;
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user ? req.user.userId : 'anonymous'}`);
  
  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security headers middleware
const additionalSecurityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
};

// Request size limiter
const requestSizeLimiter = (maxSize = '1mb') => {
  return (req, res, next) => {
    // This is handled by express.json() and express.urlencoded() limits
    // But we can add custom logic here if needed
    next();
  };
};

module.exports = {
  securityConfig,
  requestLogger,
  additionalSecurityHeaders,
  requestSizeLimiter
};
