const { db: knex } = require('../config/database');

class AnalyticsController {
  /**
   * Get performance analytics data
   * GET /api/analytics/performance?timeframe=week|month|year
   */
  async getPerformanceAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const { timeframe = 'week' } = req.query;

      // Calculate date range based on timeframe
      const dateRange = this.getDateRange(timeframe);

      // Get weekly activity data
      const weeklyActivity = await this.getWeeklyActivity(userId, dateRange);

      // Get subject breakdown (based on quiz titles/content)
      const subjectBreakdown = await this.getSubjectBreakdown(userId, dateRange);

      // Get difficulty stats
      const difficultyStats = await this.getDifficultyStats(userId, dateRange);

      // Get learning trends
      const learningTrends = await this.getLearningTrends(userId, dateRange);

      const analyticsData = {
        weeklyActivity,
        subjectBreakdown,
        difficultyStats,
        learningTrends,
        timeframe,
        generatedAt: new Date().toISOString()
      };

      res.json(analyticsData);

    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch performance analytics',
        details: error.message 
      });
    }
  }

  /**
   * Get date range based on timeframe
   */
  getDateRange(timeframe) {
    const now = new Date();
    let startDate;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return { startDate, endDate: now };
  }

  /**
   * Get weekly activity data
   */
  async getWeeklyActivity(userId, dateRange) {
    try {
      // Get activity for the last 7 days - SQLite compatible
      const activities = await knex('attempts')
        .select([
          knex.raw("strftime('%Y-%m-%d', completed_at) as date"),
          knex.raw('COUNT(*) as quizzes'),
          knex.raw('AVG(score_percentage) as avgScore')
        ])
        .where('user_id', userId)
        .where('completed_at', '>=', dateRange.startDate)
        .where('completed_at', '<=', dateRange.endDate)
        .groupBy(knex.raw("strftime('%Y-%m-%d', completed_at)"))
        .orderBy('date');

      // Create array for last 7 days with default values
      const weeklyData = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const activity = activities.find(a => a.date === dateStr);
        
        weeklyData.push({
          day: dayNames[date.getDay()],
          date: dateStr,
          quizzes: activity ? parseInt(activity.quizzes) : 0,
          avgScore: activity ? Math.round(activity.avgScore) : 0
        });
      }

      return weeklyData;

    } catch (error) {
      console.error('Error getting weekly activity:', error);
      return [];
    }
  }

  /**
   * Get subject breakdown based on quiz content
   */
  async getSubjectBreakdown(userId, dateRange) {
    try {
      // Analyze quiz titles and content to determine subjects
      const quizData = await knex('attempts')
        .select([
          'quizzes.title',
          'quizzes.id as quiz_id',
          knex.raw('COUNT(attempts.id) as quizCount'),
          knex.raw('AVG(attempts.score_percentage) as averageScore'),
          knex.raw('MAX(attempts.completed_at) as latestAttempt')
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .where('attempts.user_id', userId)
        .where('attempts.completed_at', '>=', dateRange.startDate)
        .where('attempts.completed_at', '<=', dateRange.endDate)
        .groupBy('quizzes.id', 'quizzes.title')
        .orderBy('quizCount', 'desc');

      // Categorize quizzes into subjects based on title keywords
      const subjectMap = new Map();

      for (const quiz of quizData) {
        const subject = this.categorizeQuizSubject(quiz.title);
        
        if (subjectMap.has(subject)) {
          const existing = subjectMap.get(subject);
          existing.quizCount += parseInt(quiz.quizCount);
          existing.averageScore = (existing.averageScore + parseFloat(quiz.averageScore)) / 2;
          existing.improvement = this.calculateImprovement(quiz.quiz_id, userId);
        } else {
          subjectMap.set(subject, {
            name: subject,
            quizCount: parseInt(quiz.quizCount),
            averageScore: Math.round(parseFloat(quiz.averageScore) || 0),
            improvement: await this.calculateImprovement(quiz.quiz_id, userId)
          });
        }
      }

      return Array.from(subjectMap.values()).slice(0, 10); // Top 10 subjects

    } catch (error) {
      console.error('Error getting subject breakdown:', error);
      return [];
    }
  }

  /**
   * Categorize quiz into subject based on title
   */
  categorizeQuizSubject(title) {
    if (!title) return 'General';
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('javascript') || titleLower.includes('js')) return 'JavaScript';
    if (titleLower.includes('react')) return 'React';
    if (titleLower.includes('node') || titleLower.includes('nodejs')) return 'Node.js';
    if (titleLower.includes('css') || titleLower.includes('style')) return 'CSS';
    if (titleLower.includes('html')) return 'HTML';
    if (titleLower.includes('python') || titleLower.includes('py')) return 'Python';
    if (titleLower.includes('java') && !titleLower.includes('javascript')) return 'Java';
    if (titleLower.includes('sql') || titleLower.includes('database')) return 'Database';
    if (titleLower.includes('api') || titleLower.includes('rest')) return 'API Development';
    if (titleLower.includes('algorithm') || titleLower.includes('data structure')) return 'Algorithms';
    
    return 'General Programming';
  }

  /**
   * Calculate improvement percentage for a quiz
   */
  async calculateImprovement(quizId, userId) {
    try {
      const attempts = await knex('attempts')
        .select('score_percentage', 'completed_at')
        .where({ quiz_id: quizId, user_id: userId })
        .orderBy('completed_at', 'asc')
        .limit(2);

      if (attempts.length < 2) return 0;

      const firstScore = attempts[0].score_percentage;
      const latestScore = attempts[attempts.length - 1].score_percentage;
      
      return Math.round(latestScore - firstScore);

    } catch (error) {
      console.error('Error calculating improvement:', error);
      return 0;
    }
  }

  /**
   * Get difficulty statistics
   */
  async getDifficultyStats(userId, dateRange) {
    try {
      const difficultyData = await knex('attempts')
        .select([
          'quizzes.difficulty',
          knex.raw('COUNT(*) as attemptCount'),
          knex.raw('AVG(attempts.score_percentage) as averageScore')
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .where('attempts.user_id', userId)
        .where('attempts.completed_at', '>=', dateRange.startDate)
        .where('attempts.completed_at', '<=', dateRange.endDate)
        .groupBy('quizzes.difficulty');

      const totalAttempts = difficultyData.reduce((sum, item) => sum + parseInt(item.attemptCount), 0);

      return difficultyData.map(item => ({
        level: item.difficulty || 'Unknown',
        percentage: totalAttempts > 0 ? Math.round((parseInt(item.attemptCount) / totalAttempts) * 100) : 0,
        averageScore: Math.round(parseFloat(item.averageScore) || 0),
        attemptCount: parseInt(item.attemptCount)
      }));

    } catch (error) {
      console.error('Error getting difficulty stats:', error);
      return [];
    }
  }

  /**
   * Get learning trends and insights
   */
  async getLearningTrends(userId, dateRange) {
    try {
      // Total time spent
      const timeData = await knex('attempts')
        .select([
          knex.raw('SUM(time_elapsed) as totalTimeSpent'),
          knex.raw('AVG(time_elapsed) as averageSessionTime'),
          knex.raw('COUNT(*) as totalSessions')
        ])
        .where('user_id', userId)
        .where('completed_at', '>=', dateRange.startDate)
        .where('completed_at', '<=', dateRange.endDate)
        .first();

      // Best performance day - SQLite compatible
      const dayPerformance = await knex('attempts')
        .select([
          knex.raw("strftime('%w', completed_at) as dayNumber"),
          knex.raw('AVG(score_percentage) as avgScore'),
          knex.raw('COUNT(*) as attemptCount')
        ])
        .where('user_id', userId)
        .where('completed_at', '>=', dateRange.startDate)
        .where('completed_at', '<=', dateRange.endDate)
        .groupBy(knex.raw("strftime('%w', completed_at)"))
        .orderBy('avgScore', 'desc')
        .first();

      // Convert day number to day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const bestDayName = dayPerformance ? dayNames[parseInt(dayPerformance.dayNumber)] : 'No data';

      // Most improved subject
      const subjects = await this.getSubjectBreakdown(userId, dateRange);
      const mostImprovedSubject = subjects.reduce((best, current) => 
        (current.improvement > (best.improvement || 0)) ? current : best, 
        { name: 'None', improvement: 0 }
      );

      return {
        totalTimeSpent: parseInt(timeData.totalTimeSpent) || 0,
        averageSessionTime: Math.round(parseFloat(timeData.averageSessionTime) || 0),
        totalSessions: parseInt(timeData.totalSessions) || 0,
        bestPerformanceDay: bestDayName,
        mostImprovedSubject: mostImprovedSubject.name
      };

    } catch (error) {
      console.error('Error getting learning trends:', error);
      return {
        totalTimeSpent: 0,
        averageSessionTime: 0,
        totalSessions: 0,
        bestPerformanceDay: 'No data',
        mostImprovedSubject: 'None'
      };
    }
  }
}

const analyticsController = new AnalyticsController();

module.exports = {
  getPerformanceAnalytics: (req, res) => analyticsController.getPerformanceAnalytics(req, res)
};
