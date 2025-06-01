const { db } = require('../config/database');

class QuizAttempt {
  static async create(attemptData) {
    const [id] = await db('quiz_attempts').insert(attemptData);
    return this.findById(id);
  }

  static async findById(id) {
    return db('quiz_attempts')
      .leftJoin('quizzes', 'quiz_attempts.quiz_id', 'quizzes.id')
      .leftJoin('users', 'quiz_attempts.user_id', 'users.id')
      .select(
        'quiz_attempts.*',
        'quizzes.title as quiz_title',
        'users.email as user_email'
      )
      .where('quiz_attempts.id', id)
      .first();
  }

  static async findByUserId(userId) {
    return db('quiz_attempts')
      .leftJoin('quizzes', 'quiz_attempts.quiz_id', 'quizzes.id')
      .select(
        'quiz_attempts.*',
        'quizzes.title as quiz_title'
      )
      .where('quiz_attempts.user_id', userId)
      .orderBy('started_at', 'desc');
  }

  static async findByQuizId(quizId) {
    return db('quiz_attempts')
      .leftJoin('users', 'quiz_attempts.user_id', 'users.id')
      .select(
        'quiz_attempts.*',
        'users.email as user_email'
      )
      .where('quiz_attempts.quiz_id', quizId)
      .orderBy('started_at', 'desc');
  }

  static async findActiveAttempt(userId, quizId) {
    return db('quiz_attempts')
      .where({
        user_id: userId,
        quiz_id: quizId,
        status: 'in_progress'
      })
      .first();
  }

  static async update(id, attemptData) {
    await db('quiz_attempts').where({ id }).update(attemptData);
    return this.findById(id);
  }

  static async completeAttempt(id, score, correctAnswers, timeTaken) {
    const updateData = {
      completed_at: new Date(),
      status: 'completed',
      score,
      correct_answers: correctAnswers,
      time_taken: timeTaken
    };
    
    // Calculate percentage if total_questions is set
    const attempt = await this.findById(id);
    if (attempt.total_questions > 0) {
      updateData.percentage = (correctAnswers / attempt.total_questions) * 100;
    }
    
    await db('quiz_attempts').where({ id }).update(updateData);
    return this.findById(id);
  }

  static async getUserQuizHistory(userId, quizId) {
    return db('quiz_attempts')
      .where({
        user_id: userId,
        quiz_id: quizId,
        status: 'completed'
      })
      .orderBy('completed_at', 'desc');
  }

  static async getUserStats(userId) {
    const stats = await db('quiz_attempts')
      .where({ user_id: userId, status: 'completed' })
      .select(
        db.raw('COUNT(*) as total_attempts'),
        db.raw('AVG(percentage) as avg_score'),
        db.raw('MAX(percentage) as best_score'),
        db.raw('SUM(correct_answers) as total_correct'),
        db.raw('SUM(total_questions) as total_questions')
      )
      .first();
    
    return stats;
  }
}

module.exports = QuizAttempt;
