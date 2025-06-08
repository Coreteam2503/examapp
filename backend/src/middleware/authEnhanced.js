const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RolePermission = require('../models/permissions/RolePermission');

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
    req.user.role_id = user.role_id; // Add role_id to request
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// New middleware for permission-based authorization
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.user.role_id) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned'
        });
      }

      // Check if user's role has the required permission
      const hasPermission = await RolePermission.hasPermission(req.user.role_id, permission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permission} required`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

// Middleware to check multiple permissions (user needs ALL of them)
const requireAllPermissions = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.user.role_id) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned'
        });
      }

      // Check if user's role has all required permissions
      for (const permission of permissions) {
        const hasPermission = await RolePermission.hasPermission(req.user.role_id, permission);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: `Permission denied: ${permission} required`
          });
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

// Middleware to check multiple permissions (user needs ANY of them)
const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.user.role_id) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned'
        });
      }

      // Check if user's role has any of the required permissions
      let hasAnyPermission = false;
      for (const permission of permissions) {
        const hasPermission = await RolePermission.hasPermission(req.user.role_id, permission);
        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: One of [${permissions.join(', ')}] required`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

// Helper function to check permissions programmatically
const checkPermission = async (userId, permission) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.role_id) {
      return false;
    }
    
    return await RolePermission.hasPermission(user.role_id, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

module.exports = {
  authenticateToken,
  authorizeRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  checkPermission
};
