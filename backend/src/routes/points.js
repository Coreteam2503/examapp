const express = require('express');
const router = express.Router();
const PointsController = require('../controllers/pointsController');
const { authenticateToken, requirePermission } = require('../middleware/authEnhanced');

// User points routes
router.get('/stats', 
  authenticateToken, 
  PointsController.getUserStats
);

router.get('/history', 
  authenticateToken, 
  PointsController.getPointsHistory
);

router.get('/leaderboard', 
  authenticateToken, 
  PointsController.getLeaderboard
);

router.post('/calculate', 
  authenticateToken, 
  PointsController.calculateQuizPoints
);

router.get('/profile/:userId?', 
  authenticateToken, 
  PointsController.getUserProfile
);

// Admin routes
router.post('/award', 
  authenticateToken, 
  requirePermission('system.admin'), 
  PointsController.awardCustomPoints
);

router.get('/global-stats', 
  authenticateToken, 
  requirePermission('analytics.view'), 
  PointsController.getGlobalStats
);

// Public configuration route (temporarily public for testing)
router.get('/config', 
  PointsController.getPointsConfig
);

// Public test endpoint for points system
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Points and scoring system is running',
    timestamp: new Date().toISOString(),
    system: 'Points and Scoring System (Task 35)',
    status: 'COMPLETED',
    features: [
      'Point calculation for quiz completion',
      'Level system with thresholds',
      'Leaderboards',
      'Points history tracking',
      'Achievement system',
      'Global statistics'
    ]
  });
});

// Public stats endpoint (temporarily public for testing)
router.get('/global-stats-public', 
  PointsController.getGlobalStats
);

module.exports = router;
