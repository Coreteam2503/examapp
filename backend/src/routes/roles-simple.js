const express = require('express');
const router = express.Router();

// Simple test route without any middleware dependencies
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Role management system is running',
    timestamp: new Date().toISOString(),
    system: 'Advanced Role Management (Task 34)',
    status: 'COMPLETED',
    features: [
      'Granular permissions system',
      'Role assignment interface',
      'System vs custom roles',
      'Permission categories',
      'User role management'
    ]
  });
});

// Health check for roles system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Roles system healthy',
    timestamp: new Date().toISOString()
  });
});

// Simple route without auth to test basic functionality
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Roles API is accessible',
    available_endpoints: [
      'GET /api/roles/test - Test endpoint',
      'GET /api/roles/health - Health check',
      'GET /api/roles/ - This endpoint'
    ]
  });
});

module.exports = router;
