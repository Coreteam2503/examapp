const { db } = require('../config/database');

class Upload {
  static async create(uploadData) {
    const [id] = await db('uploads').insert(uploadData);
    return this.findById(id);
  }

  static async findById(id) {
    return db('uploads')
      .leftJoin('users', 'uploads.user_id', 'users.id')
      .select(
        'uploads.*',
        'users.email as user_email'
      )
      .where('uploads.id', id)
      .first();
  }

  static async findByUserId(userId) {
    return db('uploads')
      .where({ user_id: userId })
      .orderBy('upload_date', 'desc');
  }

  static async findAll() {
    return db('uploads')
      .leftJoin('users', 'uploads.user_id', 'users.id')
      .select(
        'uploads.*',
        'users.email as user_email'
      )
      .orderBy('upload_date', 'desc');
  }

  static async update(id, uploadData) {
    await db('uploads').where({ id }).update(uploadData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('uploads').where({ id }).del();
  }

  static async updateStatus(id, status, processedDate = null) {
    const updateData = { status };
    if (processedDate) {
      updateData.processed_date = processedDate;
    }
    return db('uploads').where({ id }).update(updateData);
  }

  static async getByStatus(status) {
    return db('uploads').where({ status });
  }

  static async getUserUploadStats(userId) {
    const stats = await db('uploads')
      .where({ user_id: userId })
      .select(
        db.raw('COUNT(*) as total_uploads'),
        db.raw('SUM(file_size) as total_size'),
        db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_uploads'),
        db.raw('COUNT(CASE WHEN status = "processing" THEN 1 END) as processing_uploads'),
        db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_uploads')
      )
      .first();
    
    return stats;
  }
}

module.exports = Upload;
