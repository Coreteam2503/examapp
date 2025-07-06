const { db } = require('../config/database');

class Question {
  static async create(questionData) {
    const [id] = await db('questions').insert(questionData);
    return this.findById(id);
  }

  static async createMultiple(questionsData) {
    return db('questions').insert(questionsData);
  }

  // New: Bulk create with transaction support
  static async bulkCreate(questionsData) {
    try {
      console.log(`🔄 [Question Model] Inserting ${questionsData.length} questions`);
      
      const insertedIds = await db('questions').insert(questionsData);
      
      console.log(`📊 [Question Model] Insert returned:`, insertedIds);
      
      // Return the created questions
      if (insertedIds.length > 0) {
        // For SQLite, insertedIds contains the actual IDs
        // Get all questions that were just inserted
        const minId = Math.min(...insertedIds);
        const maxId = Math.max(...insertedIds);
        
        const createdQuestions = await db('questions')
          .whereBetween('id', [minId, maxId])
          .orderBy('id');
        
        console.log(`✅ [Question Model] Retrieved ${createdQuestions.length} created questions (IDs: ${minId}-${maxId})`);
        
        return createdQuestions;
      }
      return [];
    } catch (error) {
      console.error('Bulk create error:', error);
      throw error;
    }
  }

  // New: Advanced search with filters
  static async searchWithFilters(filters = {}, options = {}) {
    let query = db('questions').select('*');
    
    // Apply filters
    if (filters.domain) {
      query = query.where('domain', filters.domain);
    }
    
    if (filters.subject) {
      query = query.where('subject', filters.subject);
    }
    
    if (filters.source) {
      query = query.where('source', filters.source);
    }
    
    if (filters.difficulty_level) {
      query = query.where('difficulty_level', filters.difficulty_level);
    }
    
    if (filters.difficulty) {
      query = query.where('difficulty', filters.difficulty);
    }
    
    if (filters.type) {
      query = query.where('type', filters.type);
    }
    
    if (filters.weightage) {
      query = query.where('weightage', filters.weightage);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('question_text', 'like', `%${filters.search}%`)
            .orWhere('explanation', 'like', `%${filters.search}%`)
            .orWhere('hint', 'like', `%${filters.search}%`);
      });
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(parseInt(options.limit));
      
      if (options.offset) {
        query = query.offset(parseInt(options.offset));
      }
    }
    
    return query;
  }

  // New: Get statistics for question bank
  static async getStatistics() {
    const [
      totalCount,
      byDomain,
      bySubject,
      bySource,
      byDifficulty,
      byType
    ] = await Promise.all([
      // Total count
      db('questions').count('* as count').first(),
      
      // By domain
      db('questions')
        .select('domain')
        .count('* as count')
        .groupBy('domain')
        .orderBy('count', 'desc'),
        
      // By subject
      db('questions')
        .select('subject')
        .count('* as count')
        .groupBy('subject')
        .orderBy('count', 'desc'),
        
      // By source
      db('questions')
        .select('source')
        .count('* as count')
        .groupBy('source')
        .orderBy('count', 'desc'),
        
      // By difficulty level
      db('questions')
        .select('difficulty_level')
        .count('* as count')
        .groupBy('difficulty_level')
        .orderBy('count', 'desc'),
        
      // By question type
      db('questions')
        .select('type')
        .count('* as count')
        .groupBy('type')
        .orderBy('count', 'desc')
    ]);
    
    return {
      total: totalCount.count,
      byDomain,
      bySubject,
      bySource,
      byDifficulty,
      byType
    };
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
