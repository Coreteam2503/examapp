const { db } = require('../config/database');

class Quiz {
  static async create(quizData) {
    const result = await db('quizzes').insert(quizData).returning('id');
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return this.findById(id);
  }

  static async findById(id) {
    return db('quizzes')
      .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
      .leftJoin('users', 'quizzes.created_by', 'users.id')
      .select(
        'quizzes.*',
        'uploads.filename',
        'uploads.original_name',
        'users.email as creator_email'
      )
      .where('quizzes.id', id)
      .first();
  }

  static async findByUploadId(uploadId) {
    return db('quizzes').where({ upload_id: uploadId });
  }

  static async findByCreator(userId) {
    return db('quizzes')
      .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
      .select(
        'quizzes.*',
        'uploads.filename',
        'uploads.original_name'
      )
      .where('quizzes.created_by', userId)
      .orderBy('created_at', 'desc');
  }

  static async findAll() {
    return db('quizzes')
      .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
      .leftJoin('users', 'quizzes.created_by', 'users.id')
      .select(
        'quizzes.*',
        'uploads.filename',
        'uploads.original_name',
        'users.email as creator_email'
      )
      .where('quizzes.is_active', true)
      .orderBy('created_at', 'desc');
  }

  static async update(id, quizData) {
    quizData.updated_at = new Date();
    await db('quizzes').where({ id }).update(quizData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('quizzes').where({ id }).update({ is_active: false });
  }

  static async getQuizStats(quizId) {
    const stats = await db('quiz_attempts')
      .where({ quiz_id: quizId, status: 'completed' })
      .select(
        db.raw('COUNT(*) as total_attempts'),
        db.raw('AVG(percentage) as avg_score'),
        db.raw('MAX(percentage) as highest_score'),
        db.raw('MIN(percentage) as lowest_score'),
        db.raw('AVG(time_taken) as avg_time')
      )
      .first();
    
    return stats;
  }
}

module.exports = Quiz;
