const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Student management routes
router.get('/students', adminController.getStudents);
router.get('/students/summary', adminController.getStudentsSummary);
router.get('/students/:id', adminController.getStudentDetails);
router.put('/students/:id/status', adminController.updateStudentStatus);
router.delete('/students/:id', adminController.deleteStudent);

// Analytics routes - temporarily disabled
// router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
// router.get('/analytics/performance', adminController.getPerformanceAnalytics);
// router.get('/analytics/content', adminController.getContentAnalytics);
// router.get('/analytics/usage', adminController.getUsageAnalytics);

module.exports = router;
