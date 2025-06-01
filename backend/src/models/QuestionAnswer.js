const { db } = require('../config/database');

class QuestionAnswer {
  static async create(answerData) {
    const [id] = await db('question_answers').insert(answerData);
    return this.findById(id);
  }

  static async createMultiple(answersData) {
    return db('question_answers').insert(answersData);
  }

  static async findById(id) {
    return db('question_answers')
      .leftJoin('questions', 'question_answers.question_id', 'questions.id')
      .select(
        'question_answers.*',
        'questions.content as question_content',
        'questions.correct_answer'
      )
      .where('question_answers.id', id)
      .first();
  }

  static async findByAttemptId(attemptId) {
    return db('question_answers')
      .leftJoin('questions', 'question_answers.question_id', 'questions.id')
      .select(
        'question_answers.*',
        'questions.content as question_content',
        'questions.correct_answer',
        'questions.explanation',
        'questions.options',
        'questions.type'
      )
      .where('question_answers.attempt_id', attemptId)
      .orderBy('questions.order_index', 'asc');
  }

  static async findByQuestionId(questionId) {
    return db('question_answers').where({ question_id: questionId });
  }

  static async update(id, answerData) {
    await db('question_answers').where({ id }).update(answerData);
    return this.findById(id);
  }

  static async updateOrCreate(attemptId, questionId, answerData) {
    const existing = await db('question_answers')
      .where({ attempt_id: attemptId, question_id: questionId })
      .first();
    
    if (existing) {
      await db('question_answers')
        .where({ attempt_id: attemptId, question_id: questionId })
        .update(answerData);
      return existing.id;
    } else {
      const [id] = await db('question_answers').insert({
        attempt_id: attemptId,
        question_id: questionId,
        ...answerData
      });
      return id;
    }
  }

  static async delete(id) {
    return db('question_answers').where({ id }).del();
  }

  static async getAttemptScore(attemptId) {
    const stats = await db('question_answers')
      .where({ attempt_id: attemptId })
      .select(
        db.raw('COUNT(*) as total_answers'),
        db.raw('SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers'),
        db.raw('SUM(points_earned) as total_points')
      )
      .first();
    
    return stats;
  }

  static async getQuestionStats(questionId) {
    const stats = await db('question_answers')
      .where({ question_id: questionId })
      .select(
        db.raw('COUNT(*) as total_attempts'),
        db.raw('SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts'),
        db.raw('AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as success_rate')
      )
      .first();
    
    return stats;
  }
}

module.exports = QuestionAnswer;
