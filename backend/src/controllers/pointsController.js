const PointsService = require('../services/points/PointsService');

class PointsController {
  // Get user's current points and stats
  static async getUserStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await PointsService.getUserStats(userId);
      const rank = await PointsService.getUserRank(userId);

      res.json({
        success: true,
        data: {
          ...stats,
          rank,
          level_progress: {
            current_level: stats.level,
            current_points: stats.total_points,
            points_for_next_level: stats.points_for_next_level,
            progress_percentage: stats.points_for_next_level ? 
              ((stats.total_points / (stats.total_points + stats.points_for_next_level)) * 100).toFixed(1) : 100
          }
        }
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics'
      });
    }
  }

  // Get user's points history
  static async getPointsHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 50 } = req.query;
      
      const history = await PointsService.getUserPointsHistory(userId, parseInt(limit));

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting points history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get points history'
      });
    }
  }

  // Get leaderboard
  static async getLeaderboard(req, res) {
    try {
      const { limit = 10, timeframe = 'all' } = req.query;
      
      const leaderboard = await PointsService.getLeaderboard(parseInt(limit), timeframe);

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard'
      });
    }
  }

  // Calculate points for a quiz (preview before completion)
  static async calculateQuizPoints(req, res) {
    try {
      const { score, totalQuestions, correctAnswers } = req.body;
      const userId = req.user.userId;

      // Check if this would be the user's first quiz
      const { db } = require('../config/database');
      const quizCount = await db('quiz_attempts')
        .where({ user_id: userId })
        .count('id as count')
        .first();

      const isFirstQuiz = quizCount.count === 0;

      const calculation = PointsService.calculateQuizPoints(
        score, 
        totalQuestions, 
        correctAnswers, 
        isFirstQuiz
      );

      res.json({
        success: true,
        data: calculation
      });
    } catch (error) {
      console.error('Error calculating quiz points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate points'
      });
    }
  }

  // Award custom points (admin only)
  static async awardCustomPoints(req, res) {
    try {
      const { userId, points, reason, description } = req.body;

      if (!userId || !points || !reason) {
        return res.status(400).json({
          success: false,
          message: 'User ID, points, and reason are required'
        });
      }

      const awardedPoints = await PointsService.awardCustomPoints(userId, points, reason, description);

      res.json({
        success: true,
        data: {
          points_awarded: awardedPoints,
          reason,
          description
        },
        message: 'Points awarded successfully'
      });
    } catch (error) {
      console.error('Error awarding custom points:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to award points'
      });
    }
  }

  // Get points system configuration
  static async getPointsConfig(req, res) {
    try {
      res.json({
        success: true,
        data: {
          point_values: PointsService.POINTS,
          level_thresholds: PointsService.LEVEL_THRESHOLDS,
          max_level: PointsService.LEVEL_THRESHOLDS.length
        }
      });
    } catch (error) {
      console.error('Error getting points config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get points configuration'
      });
    }
  }

  // Get user's achievements and level info
  static async getUserProfile(req, res) {
    try {
      const userId = req.params.userId || req.user.userId;
      
      const stats = await PointsService.getUserStats(userId);
      const rank = await PointsService.getUserRank(userId);
      const recentHistory = await PointsService.getUserPointsHistory(userId, 10);

      // Get user info
      const { db } = require('../config/database');
      const user = await db('users')
        .select('id', 'first_name', 'last_name', 'email', 'created_at')
        .where({ id: userId })
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user,
          stats,
          rank,
          recent_activity: recentHistory,
          level_info: {
            current_level: stats.level,
            max_level: PointsService.LEVEL_THRESHOLDS.length,
            progress_to_next: stats.points_for_next_level ? 
              Math.max(0, 100 - ((stats.points_for_next_level / PointsService.getPointsForNextLevel(stats.level)) * 100)) : 100
          }
        }
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  }

  // Get global statistics
  static async getGlobalStats(req, res) {
    try {
      const { db } = require('../config/database');

      const totalUsers = await db('users').where('is_active', true).count('id as count').first();
      const totalPoints = await db('user_stats').sum('total_points as total').first();
      const totalQuizzes = await db('user_stats').sum('total_quizzes_completed as total').first();
      const avgLevel = await db('user_stats').avg('level as average').first();
      
      const topLevel = await db('user_stats').max('level as max').first();
      const topPoints = await db('user_stats').max('total_points as max').first();
      const longestStreak = await db('user_stats').max('longest_streak as max').first();

      res.json({
        success: true,
        data: {
          total_active_users: totalUsers.count || 0,
          total_points_awarded: totalPoints.total || 0,
          total_quizzes_completed: totalQuizzes.total || 0,
          average_user_level: parseFloat((avgLevel.average || 0).toFixed(2)),
          highest_level_achieved: topLevel.max || 1,
          highest_points: topPoints.max || 0,
          longest_streak: longestStreak.max || 0
        }
      });
    } catch (error) {
      console.error('Error getting global stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get global statistics'
      });
    }
  }
}

module.exports = PointsController;
