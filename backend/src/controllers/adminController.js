const { db } = require('../config/database');
const User = require('../models/User');

class AdminController {
  /**
   * Get all students with their statistics
   * GET /api/admin/students
   */
  static async getStudents(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role = 'student' } = req.query;
      const offset = (page - 1) * limit;

      // Build base query for counting
      let countQuery = db('users').where('users.role', role);

      // Apply search filter to count query if provided
      if (search) {
        countQuery = countQuery.where(function() {
          this.whereILike('users.email', `%${search}%`)
            .orWhereILike('users.first_name', `%${search}%`)
            .orWhereILike('users.last_name', `%${search}%`);
        });
      }

      // Get total count for pagination
      const [{ count: totalStudents }] = await countQuery.count('* as count');

      // Build separate query for selecting students
      let studentsQuery = db('users')
        .select([
          'users.id',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.role',
          'users.is_active',
          'users.created_at',
          'users.updated_at'
        ])
        .where('users.role', role);

      // Apply search filter to students query if provided
      if (search) {
        studentsQuery = studentsQuery.where(function() {
          this.whereILike('users.email', `%${search}%`)
            .orWhereILike('users.first_name', `%${search}%`)
            .orWhereILike('users.last_name', `%${search}%`);
        });
      }

      // Get paginated students
      const students = await studentsQuery
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .orderBy('users.created_at', 'desc');

      // Get statistics for each student
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          // Get quiz attempt statistics
          const quizStats = await db('attempts')
            .where('user_id', student.id)
            .select([
              db.raw('COUNT(*) as total_attempts'),
              db.raw('COUNT(DISTINCT quiz_id) as unique_quizzes'),
              db.raw('AVG(score_percentage) as avg_score'),
              db.raw('SUM(CASE WHEN score_percentage >= 70 THEN 1 ELSE 0 END) as passed_quizzes'),
              db.raw('MAX(completed_at) as last_attempt')
            ])
            .first();

          // Get total uploaded files
          const uploadStats = await db('uploads')
            .where('user_id', student.id)
            .count('id as upload_count')
            .first();

          return {
            ...student,
            statistics: {
              totalAttempts: parseInt(quizStats.total_attempts) || 0,
              uniqueQuizzes: parseInt(quizStats.unique_quizzes) || 0,
              averageScore: Math.round(quizStats.avg_score || 0),
              passedQuizzes: parseInt(quizStats.passed_quizzes) || 0,
              totalUploads: parseInt(uploadStats.upload_count) || 0,
              lastActivity: quizStats.last_attempt
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          students: studentsWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalStudents / limit),
            totalStudents: parseInt(totalStudents),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students',
        error: error.message
      });
    }
  }

  /**
   * Get detailed student information
   * GET /api/admin/students/:id
   */
  static async getStudentDetails(req, res) {
    try {
      const { id } = req.params;

      // Get student basic info
      const student = await User.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Get detailed quiz history
      const quizHistory = await db('attempts')
        .join('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
        .where('attempts.user_id', id)
        .select([
          'attempts.id as attempt_id',
          'attempts.score_percentage',
          'attempts.correct_answers',
          'attempts.total_questions',
          'attempts.started_at',
          'attempts.completed_at',
          'quizzes.title as quiz_title',
          'quizzes.difficulty',
          'uploads.filename as source_file'
        ])
        .orderBy('attempts.completed_at', 'desc');

      // Get upload history
      const uploadHistory = await db('uploads')
        .where('user_id', id)
        .select(['id', 'filename', 'file_size', 'file_type', 'upload_date'])
        .orderBy('upload_date', 'desc');

      // Get student's current batches
      const studentBatches = await db('user_batches')
        .join('batches', 'user_batches.batch_id', 'batches.id')
        .where('user_batches.user_id', id)
        .where('user_batches.is_active', true)
        .select([
          'batches.id',
          'batches.name',
          'batches.description',
          'batches.subject',
          'batches.domain',
          'user_batches.enrolled_at'
        ])
        .orderBy('user_batches.enrolled_at', 'desc');

      // Calculate performance metrics
      const performanceMetrics = await AdminController.calculateStudentPerformance(id);

      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            email: student.email,
            firstName: student.first_name,
            lastName: student.last_name,
            role: student.role,
            isActive: student.is_active,
            createdAt: student.created_at,
            updatedAt: student.updated_at
          },
          studentBatches,
          quizHistory,
          uploadHistory,
          performanceMetrics
        }
      });

    } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student details',
        error: error.message
      });
    }
  }

  /**
   * Update student status (activate/deactivate)
   * PUT /api/admin/students/:id/status
   */
  static async updateStudentStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const student = await User.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Update student status
      await User.update(id, { is_active: isActive });

      res.json({
        success: true,
        message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          id: parseInt(id),
          isActive
        }
      });

    } catch (error) {
      console.error('Error updating student status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student status',
        error: error.message
      });
    }
  }

  /**
   * Delete student account
   * DELETE /api/admin/students/:id
   */
  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      const student = await User.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if student has quiz attempts or uploads
      const hasAttempts = await db('attempts').where('user_id', id).first();
      const hasUploads = await db('uploads').where('user_id', id).first();

      if (hasAttempts || hasUploads) {
        // Instead of hard delete, deactivate the account to preserve data integrity
        await User.update(id, { is_active: false });
        
        res.json({
          success: true,
          message: 'Student account deactivated (has associated data)',
          data: { id: parseInt(id), deactivated: true }
        });
      } else {
        // Safe to delete if no associated data
        await User.delete(id);
        
        res.json({
          success: true,
          message: 'Student account deleted successfully',
          data: { id: parseInt(id), deleted: true }
        });
      }

    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }

  /**
   * Get students summary statistics
   * GET /api/admin/students/summary
   */
  static async getStudentsSummary(req, res) {
    try {
      // Get overall student statistics
      const totalStudents = await db('users').where('role', 'student').count('id as count').first();
      const activeStudents = await db('users').where({ role: 'student', is_active: true }).count('id as count').first();
      
      // Get activity statistics (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = await db('attempts')
        .join('users', 'attempts.user_id', 'users.id')
        .where('users.role', 'student')
        .where('attempts.completed_at', '>=', sevenDaysAgo.toISOString())
        .count('attempts.id as count')
        .first();

      // Get average performance
      const avgPerformance = await db('attempts')
        .join('users', 'attempts.user_id', 'users.id')
        .where('users.role', 'student')
        .avg('attempts.score_percentage as avg_score')
        .first();

      // Get top performers (top 5 by average score)
      const topPerformers = await db('users')
        .join('attempts', 'users.id', 'attempts.user_id')
        .where('users.role', 'student')
        .select([
          'users.id',
          'users.email',
          'users.first_name',
          'users.last_name'
        ])
        .select([
          db.raw('AVG(attempts.score_percentage) as avg_score'),
          db.raw('COUNT(attempts.id) as attempt_count')
        ])
        .groupBy('users.id', 'users.email', 'users.first_name', 'users.last_name')
        .having(db.raw('COUNT(attempts.id) > 0')) // Only include users with attempts
        .orderBy('avg_score', 'desc')
        .limit(5);

      res.json({
        success: true,
        data: {
          overview: {
            totalStudents: parseInt(totalStudents.count),
            activeStudents: parseInt(activeStudents.count),
            recentActivityCount: parseInt(recentActivity.count),
            averagePerformance: Math.round(avgPerformance.avg_score || 0)
          },
          topPerformers: topPerformers.map(student => ({
            id: student.id,
            email: student.email,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            averageScore: Math.round(student.avg_score),
            attemptCount: parseInt(student.attempt_count)
          }))
        }
      });

    } catch (error) {
      console.error('Error fetching students summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students summary',
        error: error.message
      });
    }
  }

  /**
   * Get comprehensive platform analytics for admin dashboard
   * GET /api/admin/analytics/dashboard
   */
  async getDashboardAnalytics(req, res) {
    try {
      const { timeframe = 'month' } = req.query;
      const dateRange = this.getDateRange(timeframe);

      // Get overall platform statistics
      const platformStats = await this.getPlatformStats(dateRange);
      
      // Get user growth data
      const userGrowth = await this.getUserGrowthData(dateRange);
      
      // Get quiz performance metrics
      const quizMetrics = await this.getQuizMetrics(dateRange);
      
      // Get activity trends
      const activityTrends = await this.getActivityTrends(dateRange);
      
      // Get top performing content
      const topContent = await this.getTopPerformingContent(dateRange);

      res.json({
        success: true,
        data: {
          platformStats,
          userGrowth,
          quizMetrics,
          activityTrends,
          topContent,
          timeframe,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard analytics',
        error: error.message
      });
    }
  }

  /**
   * Get detailed performance analytics for all students
   * GET /api/admin/analytics/performance
   */
  async getPerformanceAnalytics(req, res) {
    try {
      const { timeframe = 'month', groupBy = 'week' } = req.query;
      const dateRange = this.getDateRange(timeframe);

      // Get performance trends over time
      const performanceTrends = await this.getPerformanceTrends(dateRange, groupBy);
      
      // Get subject-wise performance
      const subjectPerformance = await this.getSubjectPerformance(dateRange);
      
      // Get difficulty analysis
      const difficultyAnalysis = await this.getDifficultyAnalysis(dateRange);
      
      // Get student performance distribution
      const performanceDistribution = await this.getPerformanceDistribution(dateRange);

      res.json({
        success: true,
        data: {
          performanceTrends,
          subjectPerformance,
          difficultyAnalysis,
          performanceDistribution,
          timeframe,
          groupBy
        }
      });

    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance analytics',
        error: error.message
      });
    }
  }

  /**
   * Get content analytics (uploads, quizzes, engagement)
   * GET /api/admin/analytics/content
   */
  async getContentAnalytics(req, res) {
    try {
      const { timeframe = 'month' } = req.query;
      const dateRange = this.getDateRange(timeframe);

      // Get upload statistics
      const uploadStats = await this.getUploadStatistics(dateRange);
      
      // Get quiz generation metrics
      const quizGenerationMetrics = await this.getQuizGenerationMetrics(dateRange);
      
      // Get content engagement metrics
      const engagementMetrics = await this.getContentEngagementMetrics(dateRange);
      
      // Get file type distribution
      const fileTypeDistribution = await this.getFileTypeDistribution(dateRange);

      res.json({
        success: true,
        data: {
          uploadStats,
          quizGenerationMetrics,
          engagementMetrics,
          fileTypeDistribution,
          timeframe
        }
      });

    } catch (error) {
      console.error('Error fetching content analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content analytics',
        error: error.message
      });
    }
  }

  /**
   * Get usage analytics (activity patterns, peak times)
   * GET /api/admin/analytics/usage
   */
  async getUsageAnalytics(req, res) {
    try {
      const { timeframe = 'month' } = req.query;
      const dateRange = this.getDateRange(timeframe);

      // Get daily activity patterns
      const dailyPatterns = await this.getDailyActivityPatterns(dateRange);
      
      // Get hourly usage patterns
      const hourlyPatterns = await this.getHourlyUsagePatterns(dateRange);
      
      // Get user retention metrics
      const retentionMetrics = await this.getUserRetentionMetrics(dateRange);
      
      // Get session analytics
      const sessionAnalytics = await this.getSessionAnalytics(dateRange);

      res.json({
        success: true,
        data: {
          dailyPatterns,
          hourlyPatterns,
          retentionMetrics,
          sessionAnalytics,
          timeframe
        }
      });

    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage analytics',
        error: error.message
      });
    }
  }

  // Helper methods for analytics calculations

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
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  }

  async getPlatformStats(dateRange) {
    try {
      // Total users
      const totalUsers = await db('users').count('id as count').first();
      const activeUsers = await db('users').where('is_active', true).count('id as count').first();
      
      // New users in timeframe
      const newUsers = await db('users')
        .where('created_at', '>=', dateRange.startDate)
        .where('created_at', '<=', dateRange.endDate)
        .count('id as count')
        .first();

      // Total quizzes and attempts
      const totalQuizzes = await db('quizzes').count('id as count').first();
      const totalAttempts = await db('attempts')
        .where('completed_at', '>=', dateRange.startDate)
        .where('completed_at', '<=', dateRange.endDate)
        .count('id as count')
        .first();

      // Platform-wide average score
      const avgScore = await db('attempts')
        .where('completed_at', '>=', dateRange.startDate)
        .where('completed_at', '<=', dateRange.endDate)
        .avg('score_percentage as avg')
        .first();

      return {
        totalUsers: parseInt(totalUsers.count),
        activeUsers: parseInt(activeUsers.count),
        newUsersThisPeriod: parseInt(newUsers.count),
        totalQuizzes: parseInt(totalQuizzes.count),
        totalAttemptsThisPeriod: parseInt(totalAttempts.count),
        platformAverageScore: Math.round(avgScore.avg || 0)
      };

    } catch (error) {
      console.error('Error getting platform stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisPeriod: 0,
        totalQuizzes: 0,
        totalAttemptsThisPeriod: 0,
        platformAverageScore: 0
      };
    }
  }

  async getUserGrowthData(dateRange) {
    try {
      // Get daily user registrations
      const growthData = await db('users')
        .select([
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as newUsers')
        ])
        .where('created_at', '>=', dateRange.startDate)
        .where('created_at', '<=', dateRange.endDate)
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date');

      return growthData.map(item => ({
        date: item.date,
        newUsers: parseInt(item.newUsers),
        cumulativeUsers: 0 // Will be calculated on frontend
      }));

    } catch (error) {
      console.error('Error getting user growth data:', error);
      return [];
    }
  }

  async getQuizMetrics(dateRange) {
    try {
      // Quiz completion rates
      const totalAttempts = await db('attempts')
        .where('started_at', '>=', dateRange.startDate)
        .count('id as count')
        .first();

      const completedAttempts = await db('attempts')
        .where('started_at', '>=', dateRange.startDate)
        .whereNotNull('completed_at')
        .count('id as count')
        .first();

      // Average quiz scores by difficulty
      const scoresByDifficulty = await db('attempts')
        .join('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .select([
          'quizzes.difficulty',
          db.raw('AVG(attempts.score_percentage) as avgScore'),
          db.raw('COUNT(attempts.id) as attemptCount')
        ])
        .where('attempts.completed_at', '>=', dateRange.startDate)
        .where('attempts.completed_at', '<=', dateRange.endDate)
        .groupBy('quizzes.difficulty');

      const completionRate = totalAttempts.count > 0 
        ? Math.round((completedAttempts.count / totalAttempts.count) * 100)
        : 0;

      return {
        totalAttempts: parseInt(totalAttempts.count),
        completedAttempts: parseInt(completedAttempts.count),
        completionRate,
        scoresByDifficulty: scoresByDifficulty.map(item => ({
          difficulty: item.difficulty || 'Unknown',
          averageScore: Math.round(item.avgScore || 0),
          attemptCount: parseInt(item.attemptCount)
        }))
      };

    } catch (error) {
      console.error('Error getting quiz metrics:', error);
      return {
        totalAttempts: 0,
        completedAttempts: 0,
        completionRate: 0,
        scoresByDifficulty: []
      };
    }
  }

  // Simplified placeholder methods for now
  async getActivityTrends(dateRange) {
    return [];
  }

  async getTopPerformingContent(dateRange) {
    return [];
  }

  async getPerformanceTrends(dateRange, groupBy) {
    return [];
  }

  async getSubjectPerformance(dateRange) {
    return [];
  }

  async getDifficultyAnalysis(dateRange) {
    return [];
  }

  async getPerformanceDistribution(dateRange) {
    return [];
  }

  async getUploadStatistics(dateRange) {
    return {
      totalUploads: 0,
      totalSize: 0,
      uniqueUploaders: 0
    };
  }

  async getQuizGenerationMetrics(dateRange) {
    return {
      totalQuizzes: 0,
      uniqueUploads: 0
    };
  }

  async getContentEngagementMetrics(dateRange) {
    return [];
  }

  async getFileTypeDistribution(dateRange) {
    return [];
  }

  async getDailyActivityPatterns(dateRange) {
    return [];
  }

  async getHourlyUsagePatterns(dateRange) {
    return [];
  }

  async getUserRetentionMetrics(dateRange) {
    return {
      totalActiveUsers: 0,
      returningUsers: 0,
      retentionRate: 0,
      averageActiveDays: 0
    };
  }

  async getSessionAnalytics(dateRange) {
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      uniqueUsers: 0,
      sessionsPerUser: 0
    };
  }

  /**
   * Calculate detailed performance metrics for a student
   */
  static async calculateStudentPerformance(userId) {
    try {
      // Get all attempts for performance calculation
      const attempts = await db('attempts')
        .where('user_id', userId)
        .select(['score_percentage', 'completed_at'])
        .orderBy('completed_at', 'asc');

      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          improvementTrend: 0,
          consistencyScore: 0,
          lastSevenDaysActivity: 0
        };
      }

      // Calculate improvement trend (compare first half vs second half)
      const midPoint = Math.floor(attempts.length / 2);
      const firstHalf = attempts.slice(0, midPoint);
      const secondHalf = attempts.slice(midPoint);

      const firstHalfAvg = firstHalf.reduce((sum, att) => sum + att.score_percentage, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, att) => sum + att.score_percentage, 0) / secondHalf.length;
      const improvementTrend = secondHalfAvg - firstHalfAvg;

      // Calculate consistency (standard deviation)
      const scores = attempts.map(att => att.score_percentage);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      const consistencyScore = Math.max(0, 100 - standardDeviation); // Higher consistency = lower deviation

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentAttempts = attempts.filter(att => new Date(att.completed_at) >= sevenDaysAgo);

      return {
        totalAttempts: attempts.length,
        averageScore: Math.round(avgScore),
        improvementTrend: Math.round(improvementTrend * 10) / 10, // Round to 1 decimal
        consistencyScore: Math.round(consistencyScore),
        lastSevenDaysActivity: recentAttempts.length
      };

    } catch (error) {
      console.error('Error calculating student performance:', error);
      return {
        totalAttempts: 0,
        averageScore: 0,
        improvementTrend: 0,
        consistencyScore: 0,
        lastSevenDaysActivity: 0
      };
    }
  }
}

module.exports = AdminController;