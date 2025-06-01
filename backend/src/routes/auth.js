const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Registration endpoint
router.post('/register', validateRegistration, authController.register);

// Login endpoint
router.post('/login', validateLogin, authController.login);

// Get user profile (protected route)
router.get('/profile', authenticateToken, authController.getProfile);

// Validate token endpoint
router.get('/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, authController.refreshToken);

// Test protected route
router.get('/test-protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

module.exports = router;
