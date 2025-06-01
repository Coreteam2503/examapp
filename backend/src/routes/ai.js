const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all AI routes
router.use(authenticateToken);

// Test AI API connection
router.get('/test', aiController.testConnection);

// Get AI service status
router.get('/status', aiController.getStatus);

// Get available AI features and limits
router.get('/features', aiController.getFeatures);

// Generate quiz from uploaded content
router.post('/generate-quiz', aiController.generateQuiz);

// Explain code content
router.post('/explain-code', aiController.explainCode);

module.exports = router;
