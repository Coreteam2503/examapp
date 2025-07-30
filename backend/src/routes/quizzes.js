const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { quizGenerationLimiter } = require('../middleware/rateLimiting');

// Define admin middleware
const requireAdmin = authorizeRole('admin');

// Get available options for quiz generation - MUST BE BEFORE /:id route
router.get('/generation-options', authenticateToken, QuizController.getGenerationOptions);

// Get user's available batches for quiz generation - MUST BE BEFORE /:id route
router.get('/user-batches', authenticateToken, QuizController.getUserBatches);

// Generate basic quiz from uploaded content - WITH RATE LIMITING
router.post('/generate', authenticateToken, quizGenerationLimiter, QuizController.generateQuiz);

// Generate enhanced quiz with specific question types - WITH RATE LIMITING
router.post('/generate-enhanced', authenticateToken, quizGenerationLimiter, QuizController.generateEnhancedQuiz);

// Generate dynamic quiz from question bank - WITH RATE LIMITING  
router.post('/generate-dynamic', authenticateToken, quizGenerationLimiter, QuizController.generateDynamicQuiz);

// Preview questions for given criteria without creating a quiz
router.post('/preview-questions', authenticateToken, QuizController.previewQuestions);

// Get all quizzes for current user
router.get('/', authenticateToken, QuizController.getUserQuizzes);

// Get specific quiz by ID - MUST BE AFTER specific routes
router.get('/:id', authenticateToken, QuizController.getQuizById);

// Start a quiz attempt with dynamic question selection
router.post('/:id/start-attempt', authenticateToken, QuizController.startQuizAttempt);

// Get quiz attempt data
router.get('/:id/attempt', authenticateToken, QuizController.getQuizAttempt);

// Delete quiz
router.delete('/:id', authenticateToken, QuizController.deleteQuiz);

// Admin-only: Assign quiz to batches
router.post('/:id/assign-batches', authenticateToken, requireAdmin, QuizController.assignQuizToBatches);

// Admin-only: Remove quiz from batch
router.delete('/:id/remove-batch/:batchId', authenticateToken, requireAdmin, QuizController.removeQuizFromBatch);

module.exports = router;
