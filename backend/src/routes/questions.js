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
 * GET /api/questions/:id
 * Get question by ID
 */
router.get('/:id', authenticateToken, getById);

/**
 * PUT /api/questions/:id
 * Update question by ID
 */
router.put('/:id', authenticateToken, updateById);

module.exports = router;
