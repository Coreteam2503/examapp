const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Get user progress data
router.get('/progress', authenticateToken, UserController.getUserProgress);

module.exports = router;
