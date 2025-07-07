const { db } = require('../config/database');

class Question {
  static async create(questionData) {
    const [id] = await db('questions').insert(questionData);
    return this.findById(id);
  }

  static async createMultiple(questionsData) {
    return db('questions').insert(questionsData);
  }

  // New: Bulk create with duplicate detection
  static async bulkCreate(questionsData) {
    try {
      console.log(`🔄 [Question Model] Processing ${questionsData.length} questions for bulk creation`);
      
      // Step 1: Get all existing question texts from database
      const existingQuestions = await db('questions').select('question_text');
      const existingTexts = new Set(existingQuestions.map(q => q.question_text.trim()));
      
      console.log(`📊 [Question Model] Found ${existingTexts.size} existing questions in database`);
      
      // Step 2: Filter out duplicates from incoming questions
      const uniqueQuestions = [];
      const duplicateQuestions = [];
      const seenInBatch = new Set();
      
      questionsData.forEach((question, index) => {
        const questionText = question.question_text.trim();
        
        // Check if question exists in database or already seen in this batch
        if (existingTexts.has(questionText)) {
          duplicateQuestions.push({
            index: index + 1,
            question_text: questionText.substring(0, 100) + '...',
            reason: 'exists_in_database'
          });
        } else if (seenInBatch.has(questionText)) {
          duplicateQuestions.push({
            index: index + 1,
            question_text: questionText.substring(0, 100) + '...',
            reason: 'duplicate_in_batch'
          });
        } else {
          uniqueQuestions.push(question);
          seenInBatch.add(questionText);
        }
      });
      
      console.log(`📊 [Question Model] Filtered results: ${uniqueQuestions.length} unique, ${duplicateQuestions.length} duplicates`);
      
      // Step 3: Insert only unique questions
      let createdQuestions = [];
      let insertedIds = [];
      
      if (uniqueQuestions.length > 0) {
        console.log(`🔄 [Question Model] Inserting ${uniqueQuestions.length} unique questions`);
        insertedIds = await db('questions').insert(uniqueQuestions);
        
        // Get the created questions
        if (insertedIds.length > 0) {
          const minId = Math.min(...insertedIds);
          const maxId = Math.max(...insertedIds);
          
          createdQuestions = await db('questions')
            .whereBetween('id', [minId, maxId])
            .orderBy('id');
          
          console.log(`✅ [Question Model] Successfully created ${createdQuestions.length} questions (IDs: ${minId}-${maxId})`);
        }
      } else {
        console.log(`⚠️ [Question Model] No unique questions to insert - all were duplicates`);
      }
      
      // Step 4: Return detailed result
      const result = {
        created_questions: createdQuestions,
        created_count: createdQuestions.length,
        duplicate_count: duplicateQuestions.length,
        total_processed: questionsData.length,
        duplicates: duplicateQuestions
      };
      
      console.log(`📊 [Question Model] Bulk create summary: ${result.created_count} created, ${result.duplicate_count} duplicates`);
      
      return result;
      
    } catch (error) {
      console.error('❌ [Question Model] Bulk create error:', error);
      throw error;
    }
  }

  // New: Advanced search with filters (simplified, no duplicate prevention for now)
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
    
    // Note: All questions are now available in the question bank
    // Quiz associations are managed via the quiz_questions junction table
    
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
    
    console.log('🔍 [Question Model] Executing simplified search');
    const results = await query;
    console.log(`✅ [Question Model] Found ${results.length} questions`);
    
    return results;
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
    return db('quiz_questions')
      .join('questions', 'quiz_questions.question_id', 'questions.id')
      .where('quiz_questions.quiz_id', quizId)
      .select('questions.*', 'quiz_questions.question_number')
      .orderBy('quiz_questions.question_number', 'asc');
  }

  static async update(id, questionData) {
    await db('questions').where({ id }).update(questionData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('questions').where({ id }).del();
  }

  static async deleteAssociationsByQuizId(quizId) {
    // Delete quiz-question associations (not the questions themselves)
    return db('quiz_questions').where({ quiz_id: quizId }).del();
  }

  static async countByQuizId(quizId) {
    const result = await db('quiz_questions')
      .where({ quiz_id: quizId })
      .count('question_id as count')
      .first();
    return result.count;
  }
}

module.exports = Question;
