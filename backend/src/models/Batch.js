const { db } = require('../config/database');

class Batch {
  static async create(batchData) {
    // Ensure created_by is set
    if (!batchData.created_by) {
      batchData.created_by = 1; // Default to admin user
    }
    
    const result = await db('batches').insert(batchData).returning('id');
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return this.findById(id);
  }

  static async findById(id) {
    return db('batches').where({ id }).first();
  }

  static async findAll(options = {}) {
    let query = db('batches').select('*');
    
    // Apply filters
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    if (options.createdBy) {
      query = query.where('created_by', options.createdBy);
    }
    
    if (options.subject) {
      query = query.where('subject', options.subject);
    }
    
    if (options.domain) {
      query = query.where('domain', options.domain);
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);
    
    return query;
  }

  static async update(id, batchData) {
    batchData.updated_at = new Date();
    await db('batches').where({ id }).update(batchData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('batches').where({ id }).del();
  }

  // Get users enrolled in a batch
  static async getUsers(batchId, options = {}) {
    let query = db('user_batches')
      .join('users', 'user_batches.user_id', 'users.id')
      .where('user_batches.batch_id', batchId)
      .select('users.*', 'user_batches.enrolled_at', 'user_batches.is_active as enrollment_active');
    
    if (options.isActive !== undefined) {
      query = query.where('user_batches.is_active', options.isActive);
    }
    
    return query.orderBy('user_batches.enrolled_at', 'desc');
  }

  // Get questions assigned to a batch
  static async getQuestions(batchId, options = {}) {
    let query = db('question_batches')
      .join('questions', 'question_batches.question_id', 'questions.id')
      .where('question_batches.batch_id', batchId)
      .select('questions.*', 'question_batches.created_at as assigned_at');
    
    // Apply question filters
    if (options.type) {
      query = query.where('questions.type', options.type);
    }
    
    if (options.difficulty_level) {
      query = query.where('questions.difficulty_level', options.difficulty_level);
    }
    
    return query.orderBy('question_batches.created_at', 'desc');
  }

  // Assign user to batch
  static async assignUser(batchId, userId) {
    try {
      await db('user_batches').insert({
        batch_id: batchId,
        user_id: userId,
        enrolled_at: new Date(),
        is_active: true
      });
      return true;
    } catch (error) {
      // Handle unique constraint violation (user already assigned)
      if (error.code === '23505' || error.errno === 19) {
        return false; // Already assigned
      }
      throw error;
    }
  }

  // Assign question to batch
  static async assignQuestion(batchId, questionId) {
    try {
      await db('question_batches').insert({
        batch_id: batchId,
        question_id: questionId,
        created_at: new Date()
      });
      return true;
    } catch (error) {
      // Handle unique constraint violation (question already assigned)
      if (error.code === '23505' || error.errno === 19) {
        return false; // Already assigned
      }
      throw error;
    }
  }

  // Remove user from batch
  static async removeUser(batchId, userId) {
    return db('user_batches')
      .where({ batch_id: batchId, user_id: userId })
      .del();
  }

  // Remove question from batch
  static async removeQuestion(batchId, questionId) {
    return db('question_batches')
      .where({ batch_id: batchId, question_id: questionId })
      .del();
  }

  // Deactivate user enrollment (soft delete)
  static async deactivateUser(batchId, userId) {
    return db('user_batches')
      .where({ batch_id: batchId, user_id: userId })
      .update({ is_active: false });
  }

  // Reactivate user enrollment
  static async reactivateUser(batchId, userId) {
    return db('user_batches')
      .where({ batch_id: batchId, user_id: userId })
      .update({ is_active: true });
  }

  // Get batch statistics
  static async getStatistics(batchId) {
    const [
      userCount,
      activeUserCount,
      questionCount,
      questionsByType,
      questionsByDifficulty
    ] = await Promise.all([
      // Total users
      db('user_batches').where('batch_id', batchId).count('* as count').first(),
      
      // Active users
      db('user_batches').where({ batch_id: batchId, is_active: true }).count('* as count').first(),
      
      // Total questions
      db('question_batches').where('batch_id', batchId).count('* as count').first(),
      
      // Questions by type
      db('question_batches')
        .join('questions', 'question_batches.question_id', 'questions.id')
        .where('question_batches.batch_id', batchId)
        .select('questions.type')
        .count('* as count')
        .groupBy('questions.type'),
        
      // Questions by difficulty
      db('question_batches')
        .join('questions', 'question_batches.question_id', 'questions.id')
        .where('question_batches.batch_id', batchId)
        .select('questions.difficulty_level')
        .count('* as count')
        .groupBy('questions.difficulty_level')
    ]);
    
    return {
      users: {
        total: parseInt(userCount.count),
        active: parseInt(activeUserCount.count)
      },
      questions: {
        total: parseInt(questionCount.count),
        byType: questionsByType,
        byDifficulty: questionsByDifficulty
      }
    };
  }
}

module.exports = Batch;
