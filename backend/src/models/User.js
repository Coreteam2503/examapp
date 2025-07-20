const { db } = require('../config/database');

class User {
  static async create(userData) {
    const result = await db('users').insert(userData).returning('id');
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return this.findById(id);
  }

  static async findById(id) {
    return db('users').where({ id }).first();
  }

  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  static async findAll() {
    return db('users').select('id', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at');
  }

  static async update(id, userData) {
    userData.updated_at = new Date();
    await db('users').where({ id }).update(userData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('users').where({ id }).del();
  }

  static async countByRole(role) {
    const result = await db('users').where({ role }).count('id as count').first();
    return result.count;
  }

  // Batch-related methods
  static async getBatches(userId, options = {}) {
    let query = db('user_batches')
      .join('batches', 'user_batches.batch_id', 'batches.id')
      .where('user_batches.user_id', userId)
      .select('batches.*', 'user_batches.enrolled_at', 'user_batches.is_active as enrollment_active');
    
    if (options.isActive !== undefined) {
      query = query.where('user_batches.is_active', options.isActive);
    }
    
    if (options.batchIsActive !== undefined) {
      query = query.where('batches.is_active', options.batchIsActive);
    }
    
    return query.orderBy('user_batches.enrolled_at', 'desc');
  }

  static async getActiveBatches(userId) {
    return this.getBatches(userId, { isActive: true, batchIsActive: true });
  }

  static async isEnrolledInBatch(userId, batchId) {
    const enrollment = await db('user_batches')
      .where({ user_id: userId, batch_id: batchId, is_active: true })
      .first();
    return !!enrollment;
  }

  static async getStudents(options = {}) {
    let query = db('users').where('role', 'student');
    
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    return query.select('id', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at')
                .orderBy('created_at', 'desc');
  }

  static async getAdmins() {
    return db('users')
      .where('role', 'admin')
      .select('id', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at')
      .orderBy('created_at', 'desc');
  }
}

module.exports = User;
