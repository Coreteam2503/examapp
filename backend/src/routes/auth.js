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

// Test protected route
router.get('/test-protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

module.exports = router;
