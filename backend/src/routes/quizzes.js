const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');
const { authenticateToken } = require('../middleware/auth');
const { quizGenerationLimiter } = require('../middleware/rateLimiting');

// Generate basic quiz from uploaded content - WITH RATE LIMITING
router.post('/generate', authenticateToken, quizGenerationLimiter, QuizController.generateQuiz);

// Generate enhanced quiz with specific question types
router.post('/generate-enhanced', authenticateToken, QuizController.generateEnhancedQuiz);

// Get all quizzes for current user
router.get('/', authenticateToken, QuizController.getUserQuizzes);

// Get specific quiz by ID
router.get('/:id', authenticateToken, QuizController.getQuizById);

// Delete quiz
router.delete('/:id', authenticateToken, QuizController.deleteQuiz);

module.exports = router;
