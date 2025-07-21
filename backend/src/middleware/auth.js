const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log(" test 1")
    console.log('Auth middleware - Header:', authHeader ? 'Present' : 'Missing');
    console.log('Auth middleware - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    console.log('Auth middleware - JWT Secret being used:', jwtSecret);
    console.log('Auth middleware - Env JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Auth middleware - Decoded token:', decoded);
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message, error.name);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's passed as an array
    const flatRoles = roles.flat();
    
    console.log('🔒 Authorization check:', {
      requiredRoles: flatRoles,
      userRole: req.user?.role,
      userId: req.user?.userId,
      userEmail: req.user?.email
    });

    if (!req.user) {
      console.log('❌ Authorization failed: No user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!flatRoles.includes(req.user.role)) {
      console.log('❌ Authorization failed: User role not in required roles');
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        debug: {
          userRole: req.user.role,
          requiredRoles: flatRoles
        }
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
