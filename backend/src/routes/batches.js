const express = require('express');
const router = express.Router();
const BatchController = require('../controllers/BatchController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Define admin middleware
const requireAdmin = authorizeRole('admin');

// GET /api/batches - Get all batches
router.get('/', BatchController.getBatches);

// POST /api/batches - Create new batch (admin only)
router.post('/', requireAdmin, BatchController.createBatch);

// GET /api/batches/:id - Get specific batch
router.get('/:id', BatchController.getBatch);

// PUT /api/batches/:id - Update batch (admin only)
router.put('/:id', requireAdmin, BatchController.updateBatch);

// DELETE /api/batches/:id - Delete batch (admin only)
router.delete('/:id', requireAdmin, BatchController.deleteBatch);

// GET /api/batches/:id/users - Get users in batch
router.get('/:id/users', BatchController.getBatchUsers);

// GET /api/batches/:id/questions - Get questions in batch
router.get('/:id/questions', BatchController.getBatchQuestions);

// POST /api/batches/:id/users - Assign user to batch (admin only)
router.post('/:id/users', requireAdmin, BatchController.assignUser);

// POST /api/batches/:id/questions - Assign question to batch (admin only)
router.post('/:id/questions', requireAdmin, BatchController.assignQuestion);

// POST /api/batches/:id/questions/bulk - Bulk assign questions to batch (admin only)
router.post('/:id/questions/bulk', requireAdmin, BatchController.bulkAssignQuestions);

// DELETE /api/batches/:id/users/:userId - Remove user from batch (admin only)
router.delete('/:id/users/:userId', requireAdmin, BatchController.removeUser);

// DELETE /api/batches/:id/questions/:questionId - Remove question from batch (admin only)
router.delete('/:id/questions/:questionId', requireAdmin, BatchController.removeQuestion);

// GET /api/batches/:id/statistics - Get batch statistics
router.get('/:id/statistics', BatchController.getBatchStatistics);

module.exports = router;
