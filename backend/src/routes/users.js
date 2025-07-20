const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get user progress data
router.get('/progress', authenticateToken, UserController.getUserProgress);

// Get user's batches (own batches or admin can view any)
router.get('/:userId/batches', authenticateToken, UserController.getUserBatches);

// Update user batch assignments (admin only)
router.put('/:userId/batches', authenticateToken, authorizeRole(['admin']), UserController.updateUserBatches);

// Register new user with batch assignment
router.post('/register-with-batch', UserController.registerWithBatch);

module.exports = router;
