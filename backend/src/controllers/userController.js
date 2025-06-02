const { db: knex } = require('../config/database');

class UserController {
  /**
   * Get user progress data
   * GET /api/users/progress
   */
  async getUserProgress(req, res) {
    try {
      const userId = req.user.userId;

      // Get total quiz attempts and completion stats
      const quizStats = await knex('attempts')
        .where('user_id', userId)
        .select([
          knex.raw('COUNT(DISTINCT quiz_id) as totalQuizzes'),
          knex.raw('COUNT(*) as completedQuizzes'),
          knex.raw('AVG(score_percentage) as averageScore'),
          knex.raw('SUM(CASE WHEN score_percentage >= 70 THEN 1 ELSE 0 END) as passedQuizzes')
        ])
        .first();

      // Calculate streak days (consecutive days with quiz activity)
      const streakData = await this.calculateLearningStreak(userId);

      // Calculate total points (example: 10 points per correct answer)
      const pointsData = await knex('attempts')
        .where('user_id', userId)
        .select([
          knex.raw('SUM(correct_answers * 10) as totalPoints'),
          knex.raw('COUNT(*) as totalAttempts')
        ])
        .first();

      // Get available quizzes count
      const availableQuizzes = await knex('quizzes')
        .where('user_id', userId)
        .count('id as count')
        .first();

      const progressData = {
        totalQuizzes: parseInt(availableQuizzes.count) || 0,
        completedQuizzes: parseInt(quizStats.completedQuizzes) || 0,
        averageScore: Math.round(quizStats.averageScore || 0),
        streakDays: streakData.currentStreak,
        totalPoints: parseInt(pointsData.totalPoints) || 0,
        passedQuizzes: parseInt(quizStats.passedQuizzes) || 0,
        totalAttempts: parseInt(pointsData.totalAttempts) || 0
      };

      res.json(progressData);

    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user progress',
        details: error.message 
      });
    }
  }

  /**
   * Calculate learning streak (consecutive days with quiz activity)
   */
  async calculateLearningStreak(userId) {
    try {
      // Get distinct dates with quiz activity, ordered by date desc
      const activityDates = await knex('attempts')
        .where('user_id', userId)
        .select(knex.raw('DATE(completed_at) as activity_date'))
        .groupBy(knex.raw('DATE(completed_at)'))
        .orderBy('activity_date', 'desc');

      if (activityDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if there's activity today or yesterday to start streak
      const latestActivity = new Date(activityDates[0].activity_date);
      latestActivity.setHours(0, 0, 0, 0);

      if (latestActivity.getTime() === today.getTime() || 
          latestActivity.getTime() === yesterday.getTime()) {
        currentStreak = 1;

        // Count consecutive days
        for (let i = 1; i < activityDates.length; i++) {
          const currentDate = new Date(activityDates[i - 1].activity_date);
          const previousDate = new Date(activityDates[i].activity_date);
          
          const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            currentStreak++;
            tempStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      for (let i = 1; i < activityDates.length; i++) {
        const currentDate = new Date(activityDates[i - 1].activity_date);
        const previousDate = new Date(activityDates[i].activity_date);
        
        const dayDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      return { currentStreak, longestStreak };

    } catch (error) {
      console.error('Error calculating learning streak:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }
}

const userController = new UserController();

module.exports = {
  getUserProgress: (req, res) => userController.getUserProgress(req, res)
};
