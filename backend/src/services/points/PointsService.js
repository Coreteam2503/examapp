const { db } = require('../../config/database');

class PointsService {
  // Point calculation constants
  static POINTS = {
    QUIZ_COMPLETION: 10,
    CORRECT_ANSWER: 5,
    PERFECT_QUIZ: 50, // Bonus for 100% score
    STREAK_BONUS: 25, // Daily streak bonus
    FIRST_QUIZ: 20, // First quiz completion
    LEVEL_UP_MULTIPLIER: 2
  };

  // Level thresholds (points needed for each level)
  static LEVEL_THRESHOLDS = [
    0,     // Level 1
    100,   // Level 2
    250,   // Level 3
    500,   // Level 4
    1000,  // Level 5
    2000,  // Level 6
    4000,  // Level 7
    8000,  // Level 8
    15000, // Level 9
    30000  // Level 10
  ];

  // Award points for quiz completion
  static async awardQuizPoints(userId, quizAttemptId, score, totalQuestions, correctAnswers) {
    try {
      return await db.transaction(async (trx) => {
        let totalPoints = 0;
        const pointsEntries = [];

        // Base points for quiz completion
        const completionPoints = this.POINTS.QUIZ_COMPLETION;
        totalPoints += completionPoints;
        pointsEntries.push({
          user_id: userId,
          quiz_attempt_id: quizAttemptId,
          points_earned: completionPoints,
          reason: 'quiz_completion',
          description: 'Completed a quiz'
        });

        // Points for correct answers
        const correctAnswerPoints = correctAnswers * this.POINTS.CORRECT_ANSWER;
        if (correctAnswerPoints > 0) {
          totalPoints += correctAnswerPoints;
          pointsEntries.push({
            user_id: userId,
            quiz_attempt_id: quizAttemptId,
            points_earned: correctAnswerPoints,
            reason: 'correct_answers',
            description: `${correctAnswers} correct answers`
          });
        }

        // Perfect score bonus
        if (score === 100) {
          totalPoints += this.POINTS.PERFECT_QUIZ;
          pointsEntries.push({
            user_id: userId,
            quiz_attempt_id: quizAttemptId,
            points_earned: this.POINTS.PERFECT_QUIZ,
            reason: 'perfect_score',
            description: 'Perfect quiz score (100%)'
          });
        }

        // Check for first quiz bonus
        const quizCount = await trx('quiz_attempts')
          .where({ user_id: userId })
          .count('id as count')
          .first();

        if (quizCount.count === 1) {
          totalPoints += this.POINTS.FIRST_QUIZ;
          pointsEntries.push({
            user_id: userId,
            quiz_attempt_id: quizAttemptId,
            points_earned: this.POINTS.FIRST_QUIZ,
            reason: 'first_quiz',
            description: 'First quiz completed'
          });
        }

        // Insert all point entries
        await trx('user_points').insert(pointsEntries);

        // Update user stats
        await this.updateUserStats(userId, {
          pointsToAdd: totalPoints,
          quizCompleted: true,
          correctAnswers,
          totalAnswers: totalQuestions,
          score
        }, trx);

        return { totalPoints, pointsEntries };
      });
    } catch (error) {
      console.error('Error awarding quiz points:', error);
      throw error;
    }
  }

  // Award streak bonus points
  static async awardStreakBonus(userId, streakDays) {
    try {
      const bonusPoints = streakDays * this.POINTS.STREAK_BONUS;
      
      await db('user_points').insert({
        user_id: userId,
        points_earned: bonusPoints,
        reason: 'streak_bonus',
        description: `${streakDays} day streak bonus`
      });

      await this.updateUserStats(userId, { pointsToAdd: bonusPoints });

      return bonusPoints;
    } catch (error) {
      console.error('Error awarding streak bonus:', error);
      throw error;
    }
  }

  // Update user statistics
  static async updateUserStats(userId, updates = {}, trx = db) {
    try {
      const {
        pointsToAdd = 0,
        quizCompleted = false,
        correctAnswers = 0,
        totalAnswers = 0,
        score = 0
      } = updates;

      // Get or create user stats
      let userStats = await trx('user_stats').where({ user_id: userId }).first();
      
      if (!userStats) {
        await trx('user_stats').insert({
          user_id: userId,
          total_points: 0,
          total_quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          average_score: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          points_for_next_level: this.LEVEL_THRESHOLDS[1]
        });
        userStats = await trx('user_stats').where({ user_id: userId }).first();
      }

      const updates_data = {};

      // Update points
      if (pointsToAdd > 0) {
        updates_data.total_points = userStats.total_points + pointsToAdd;
      }

      // Update quiz statistics
      if (quizCompleted) {
        updates_data.total_quizzes_completed = userStats.total_quizzes_completed + 1;
        updates_data.last_quiz_date = new Date().toISOString().split('T')[0];

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        const lastQuizDate = userStats.last_quiz_date;
        
        if (lastQuizDate) {
          const daysDiff = Math.floor((new Date(today) - new Date(lastQuizDate)) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            // Continue streak
            updates_data.current_streak = userStats.current_streak + 1;
            updates_data.longest_streak = Math.max(userStats.longest_streak, updates_data.current_streak);
          } else if (daysDiff > 1) {
            // Streak broken
            updates_data.current_streak = 1;
          }
        } else {
          // First quiz
          updates_data.current_streak = 1;
          updates_data.longest_streak = 1;
        }
      }

      // Update answer statistics
      if (totalAnswers > 0) {
        updates_data.correct_answers = userStats.correct_answers + correctAnswers;
        updates_data.total_answers = userStats.total_answers + totalAnswers;
        
        // Recalculate average score
        const totalQuizzes = updates_data.total_quizzes_completed || userStats.total_quizzes_completed;
        if (totalQuizzes > 0) {
          const currentTotalScore = userStats.average_score * (totalQuizzes - 1);
          updates_data.average_score = ((currentTotalScore + score) / totalQuizzes).toFixed(2);
        }
      }

      // Check for level up
      const newTotalPoints = updates_data.total_points || userStats.total_points;
      const newLevel = this.calculateLevel(newTotalPoints);
      
      if (newLevel > userStats.level) {
        updates_data.level = newLevel;
        updates_data.points_for_next_level = this.getPointsForNextLevel(newLevel);
        
        // Award level up bonus
        const levelUpBonus = newLevel * this.POINTS.LEVEL_UP_MULTIPLIER;
        await trx('user_points').insert({
          user_id: userId,
          points_earned: levelUpBonus,
          reason: 'level_up',
          description: `Reached level ${newLevel}`
        });
        
        updates_data.total_points = newTotalPoints + levelUpBonus;
      } else {
        updates_data.points_for_next_level = this.getPointsForNextLevel(userStats.level) - newTotalPoints;
      }

      // Update the record
      await trx('user_stats').where({ user_id: userId }).update(updates_data);

      return await trx('user_stats').where({ user_id: userId }).first();
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Calculate user level based on points
  static calculateLevel(points) {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= this.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Get points needed for next level
  static getPointsForNextLevel(currentLevel) {
    if (currentLevel >= this.LEVEL_THRESHOLDS.length) {
      return null; // Max level reached
    }
    return this.LEVEL_THRESHOLDS[currentLevel];
  }

  // Get user's current stats
  static async getUserStats(userId) {
    try {
      let userStats = await db('user_stats').where({ user_id: userId }).first();
      
      if (!userStats) {
        // Create initial stats for user
        await db('user_stats').insert({
          user_id: userId,
          total_points: 0,
          total_quizzes_completed: 0,
          correct_answers: 0,
          total_answers: 0,
          average_score: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          points_for_next_level: this.LEVEL_THRESHOLDS[1]
        });
        userStats = await db('user_stats').where({ user_id: userId }).first();
      }

      return userStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Get user's points history
  static async getUserPointsHistory(userId, limit = 50) {
    try {
      return await db('user_points')
        .where({ user_id: userId })
        .orderBy('earned_at', 'desc')
        .limit(limit);
    } catch (error) {
      console.error('Error getting user points history:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10, timeframe = 'all') {
    try {
      let query = db('user_stats')
        .join('users', 'user_stats.user_id', 'users.id')
        .select(
          'users.id',
          'users.first_name',
          'users.last_name',
          'users.email',
          'user_stats.total_points',
          'user_stats.level',
          'user_stats.total_quizzes_completed',
          'user_stats.average_score',
          'user_stats.current_streak',
          'user_stats.longest_streak'
        )
        .where('users.is_active', true)
        .orderBy('user_stats.total_points', 'desc')
        .limit(limit);

      // Add timeframe filtering if needed
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.where('user_stats.updated_at', '>=', weekAgo);
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.where('user_stats.updated_at', '>=', monthAgo);
      }

      return await query;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Calculate points for a quiz attempt (without awarding them)
  static calculateQuizPoints(score, totalQuestions, correctAnswers, isFirstQuiz = false) {
    let totalPoints = 0;
    const breakdown = [];

    // Base completion points
    totalPoints += this.POINTS.QUIZ_COMPLETION;
    breakdown.push({
      type: 'completion',
      points: this.POINTS.QUIZ_COMPLETION,
      description: 'Quiz completion'
    });

    // Correct answer points
    const correctAnswerPoints = correctAnswers * this.POINTS.CORRECT_ANSWER;
    if (correctAnswerPoints > 0) {
      totalPoints += correctAnswerPoints;
      breakdown.push({
        type: 'correct_answers',
        points: correctAnswerPoints,
        description: `${correctAnswers} correct answers`
      });
    }

    // Perfect score bonus
    if (score === 100) {
      totalPoints += this.POINTS.PERFECT_QUIZ;
      breakdown.push({
        type: 'perfect_score',
        points: this.POINTS.PERFECT_QUIZ,
        description: 'Perfect score bonus'
      });
    }

    // First quiz bonus
    if (isFirstQuiz) {
      totalPoints += this.POINTS.FIRST_QUIZ;
      breakdown.push({
        type: 'first_quiz',
        points: this.POINTS.FIRST_QUIZ,
        description: 'First quiz bonus'
      });
    }

    return { totalPoints, breakdown };
  }

  // Get user rank
  static async getUserRank(userId) {
    try {
      const userStats = await this.getUserStats(userId);
      
      const rank = await db('user_stats')
        .join('users', 'user_stats.user_id', 'users.id')
        .where('users.is_active', true)
        .where('user_stats.total_points', '>', userStats.total_points)
        .count('* as count')
        .first();

      return (rank.count || 0) + 1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  }

  // Award custom points (for achievements, admin actions, etc.)
  static async awardCustomPoints(userId, points, reason, description) {
    try {
      await db('user_points').insert({
        user_id: userId,
        points_earned: points,
        reason: reason,
        description: description
      });

      await this.updateUserStats(userId, { pointsToAdd: points });

      return points;
    } catch (error) {
      console.error('Error awarding custom points:', error);
      throw error;
    }
  }
}

module.exports = PointsService;
