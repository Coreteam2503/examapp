const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// Get performance analytics
router.get('/performance', authenticateToken, AnalyticsController.getPerformanceAnalytics);

module.exports = router;
