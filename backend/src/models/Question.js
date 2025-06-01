const { db } = require('../config/database');

class Question {
  static async create(questionData) {
    const [id] = await db('questions').insert(questionData);
    return this.findById(id);
  }

  static async createMultiple(questionsData) {
    return db('questions').insert(questionsData);
  }

  static async findById(id) {
    return db('questions').where({ id }).first();
  }

  static async findByQuizId(quizId) {
    return db('questions')
      .where({ quiz_id: quizId })
      .orderBy('order_index', 'asc');
  }

  static async update(id, questionData) {
    await db('questions').where({ id }).update(questionData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('questions').where({ id }).del();
  }

  static async deleteByQuizId(quizId) {
    return db('questions').where({ quiz_id: quizId }).del();
  }

  static async countByQuizId(quizId) {
    const result = await db('questions')
      .where({ quiz_id: quizId })
      .count('id as count')
      .first();
    return result.count;
  }
}

module.exports = Question;
