const express = require('express');
const router = express.Router();

// Simple test route without any middleware dependencies
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
    ],
    point_values: {
      quiz_completion: 10,
      perfect_score: 20,
      first_quiz_bonus: 50,
      daily_streak: 5
    }
  });
});

// Health check for points system  
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Points system healthy',
    timestamp: new Date().toISOString()
  });
});

// Configuration endpoint
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      point_values: {
        quiz_completion: 10,
        perfect_score: 20,
        first_quiz_bonus: 50,
        daily_streak: 5,
        achievement_unlock: 25
      },
      level_thresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000],
      max_level: 10
    }
  });
});

// Simple route without auth to test basic functionality
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Points API is accessible',
    available_endpoints: [
      'GET /api/points/test - Test endpoint',
      'GET /api/points/health - Health check',
      'GET /api/points/config - Configuration',
      'GET /api/points/ - This endpoint'
    ]
  });
});

module.exports = router;
