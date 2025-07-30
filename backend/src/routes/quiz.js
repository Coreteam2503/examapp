const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Generate quiz from uploaded content
router.post('/generate', auth, QuizController.generateQuiz);

// Get all quizzes for current user
router.get('/', auth, QuizController.getUserQuizzes);

// Get specific quiz by ID
router.get('/:id', auth, QuizController.getQuizById);

// Start a quiz attempt with dynamic question selection
router.post('/:id/start-attempt', auth, QuizController.startQuizAttempt);

// Delete quiz
router.delete('/:id', auth, QuizController.deleteQuiz);

module.exports = router;
