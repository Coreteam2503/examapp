const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/questionController');
const { authenticateToken } = require('../middleware/auth');

// Initialize controller
const questionController = new QuestionController();

// Bind controller methods to preserve 'this' context
const bulkCreate = questionController.bulkCreate.bind(questionController);
const search = questionController.search.bind(questionController);
const getStatistics = questionController.getStatistics.bind(questionController);
const getById = questionController.getById.bind(questionController);
const updateById = questionController.updateById.bind(questionController);

// Question Bank API Routes (all protected with JWT authentication)

/**
 * POST /api/questions/bulk
 * Bulk create questions with validation
 */
router.post('/bulk', authenticateToken, bulkCreate);

/**
 * GET /api/questions/search
 * Search questions with filters and pagination
 */
router.get('/search', authenticateToken, search);

/**
 * GET /api/questions/statistics
 * Get question bank statistics
 */
router.get('/statistics', authenticateToken, getStatistics);

/**
 * GET /api/questions/by-creator/:creatorId
 * Get questions by creator (batch-aware)
 */
router.get('/by-creator/:creatorId', authenticateToken, (req, res) => {
  const controller = new QuestionController();
  controller.getQuestionsByCreator(req, res);
});

/**
 * POST /api/questions/by-batches
 * Get questions by batches (batch-aware)
 */
router.post('/by-batches', authenticateToken, (req, res) => {
  const controller = new QuestionController();
  controller.getQuestionsByBatches(req, res);
});

/**
 * POST /api/questions/search
 * Enhanced search with batch filtering
 */
router.post('/search', authenticateToken, (req, res) => {
  const controller = new QuestionController();
  controller.searchQuestions(req, res);
});

/**
 * GET /api/questions/:id
 * Get question by ID
 */
router.get('/:id', authenticateToken, getById);

/**
 * GET /api/questions/:id/batches
 * Get batches for a question
 */
router.get('/:id/batches', authenticateToken, (req, res) => {
  const controller = new QuestionController();
  controller.getQuestionBatches(req, res);
});

/**
 * PUT /api/questions/:id
 * Update question by ID
 */
router.put('/:id', authenticateToken, updateById);

module.exports = router;
