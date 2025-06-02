const express = require('express');
const router = express.Router();
const QuizAttemptController = require('../controllers/quizAttemptController');
const { authenticateToken } = require('../middleware/auth');

// Submit a quiz attempt
router.post('/', authenticateToken, QuizAttemptController.submitAttempt);

// Get user's quiz attempts history
router.get('/', authenticateToken, QuizAttemptController.getUserAttempts);

// Get user statistics and analytics
router.get('/statistics', authenticateToken, QuizAttemptController.getUserStatistics);

// Get recent quiz attempts for dashboard
router.get('/recent', authenticateToken, QuizAttemptController.getRecentAttempts);

// Get specific attempt by ID
router.get('/:id', authenticateToken, QuizAttemptController.getAttempt);

// Get detailed results for an attempt
router.get('/:id/detailed', authenticateToken, QuizAttemptController.getDetailedResults);

// Delete an attempt
router.delete('/:id', authenticateToken, QuizAttemptController.deleteAttempt);

module.exports = router;
