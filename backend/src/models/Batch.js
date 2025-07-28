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

  // Get quizzes available to a batch based on criteria
  static async getBatchQuizzes(batchId, options = {}) {
    const batch = await this.findById(batchId);
    if (!batch || !batch.quiz_criteria) {
      // If no criteria set, return manually assigned quizzes only
      return db('quiz_batches')
        .join('quizzes', 'quiz_batches.quiz_id', 'quizzes.id')
        .where('quiz_batches.batch_id', batchId)
        .select('quizzes.*', 'quiz_batches.assigned_at');
    }

    const criteria = typeof batch.quiz_criteria === 'string' 
      ? JSON.parse(batch.quiz_criteria) 
      : batch.quiz_criteria;

    // Build query to find quizzes whose questions match criteria
    let query = db('quizzes')
      .join('quiz_questions', 'quizzes.id', 'quiz_questions.quiz_id')
      .join('questions', 'quiz_questions.question_id', 'questions.id')
      .where('quizzes.is_active', true);

    // Apply criteria filters
    if (criteria.sources && criteria.sources.length > 0) {
      query = query.whereIn('questions.source', criteria.sources);
    }

    if (criteria.difficulty_levels && criteria.difficulty_levels.length > 0) {
      query = query.whereIn('questions.difficulty_level', criteria.difficulty_levels);
    }

    if (criteria.domains && criteria.domains.length > 0) {
      query = query.whereIn('questions.domain', criteria.domains);
    }

    if (criteria.subjects && criteria.subjects.length > 0) {
      query = query.whereIn('questions.subject', criteria.subjects);
    }

    // Group by quiz and ensure minimum question count if specified
    query = query.groupBy('quizzes.id', 'quizzes.title', 'quizzes.description', 'quizzes.difficulty', 'quizzes.time_limit', 'quizzes.created_at', 'quizzes.updated_at');

    if (criteria.min_questions) {
      query = query.having(db.raw('count(questions.id) >= ?', [criteria.min_questions]));
    }

    const quizzes = await query.select('quizzes.*', db.raw('count(questions.id) as question_count'));

    return quizzes.map(quiz => ({
      ...quiz,
      source: 'criteria_match' // Indicate this came from criteria matching
    }));
  }

  // Update batch criteria and trigger auto-assignment
  static async updateBatchCriteria(batchId, criteria) {
    await db('batches').where('id', batchId).update({
      quiz_criteria: JSON.stringify(criteria),
      updated_at: new Date()
    });
    
    return this.findById(batchId);
  }

  // Auto-assign quiz to batches based on matching criteria
  static async autoAssignQuizToBatches(quizId) {
    try {
      console.log(`🔄 Auto-assigning quiz ${quizId} to matching batches...`);
      
      // Get quiz questions to determine criteria
      const quizQuestions = await db('quiz_questions')
        .join('questions', 'quiz_questions.question_id', 'questions.id')
        .where('quiz_questions.quiz_id', quizId)
        .select('questions.source', 'questions.difficulty_level', 'questions.domain', 'questions.subject');

      if (quizQuestions.length === 0) {
        console.log(`⚠️ Quiz ${quizId} has no questions, skipping auto-assignment`);
        return [];
      }

      // Extract unique values from quiz questions
      const quizSources = [...new Set(quizQuestions.map(q => q.source))];
      const quizDifficulties = [...new Set(quizQuestions.map(q => q.difficulty_level))];
      const quizDomains = [...new Set(quizQuestions.map(q => q.domain))];
      const quizSubjects = [...new Set(quizQuestions.map(q => q.subject))];

      console.log(`📊 Quiz criteria: sources=${quizSources.length}, difficulties=${quizDifficulties.length}`);

      // Find batches with matching criteria
      const batches = await db('batches')
        .whereNotNull('quiz_criteria')
        .where('is_active', true);

      const matchingBatches = [];

      for (const batch of batches) {
        const criteria = typeof batch.quiz_criteria === 'string' 
          ? JSON.parse(batch.quiz_criteria) 
          : batch.quiz_criteria;

        let matches = true;

        // Check if quiz sources match batch criteria
        if (criteria.sources && criteria.sources.length > 0) {
          const hasMatchingSource = quizSources.some(source => 
            criteria.sources.includes(source)
          );
          if (!hasMatchingSource) matches = false;
        }

        // Check if quiz difficulties match batch criteria
        if (criteria.difficulty_levels && criteria.difficulty_levels.length > 0) {
          const hasMatchingDifficulty = quizDifficulties.some(diff => 
            criteria.difficulty_levels.includes(diff)
          );
          if (!hasMatchingDifficulty) matches = false;
        }

        // Check domains and subjects similarly
        if (criteria.domains && criteria.domains.length > 0) {
          const hasMatchingDomain = quizDomains.some(domain => 
            criteria.domains.includes(domain)
          );
          if (!hasMatchingDomain) matches = false;
        }

        if (criteria.subjects && criteria.subjects.length > 0) {
          const hasMatchingSubject = quizSubjects.some(subject => 
            criteria.subjects.includes(subject)
          );
          if (!hasMatchingSubject) matches = false;
        }

        if (matches) {
          matchingBatches.push(batch);
        }
      }

      console.log(`✅ Found ${matchingBatches.length} matching batches for quiz ${quizId}`);

      // Auto-assign to matching batches
      const assignments = [];
      for (const batch of matchingBatches) {
        try {
          // Check if already assigned
          const existing = await db('quiz_batches')
            .where({ quiz_id: quizId, batch_id: batch.id })
            .first();

          if (!existing) {
            await db('quiz_batches').insert({
              quiz_id: quizId,
              batch_id: batch.id,
              assigned_by: 1, // System assignment
              assigned_at: new Date()
            });
            assignments.push({ batchId: batch.id, batchName: batch.name });
            console.log(`✅ Assigned quiz ${quizId} to batch ${batch.id} (${batch.name})`);
          }
        } catch (error) {
          console.error(`❌ Error assigning quiz ${quizId} to batch ${batch.id}:`, error);
        }
      }

      return assignments;
    } catch (error) {
      console.error('❌ Error in auto-assignment:', error);
      return [];
    }
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
