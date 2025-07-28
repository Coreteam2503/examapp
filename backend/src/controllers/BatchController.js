const Batch = require('../models/Batch');
const Question = require('../models/Question');
const User = require('../models/User');
const { db } = require('../config/database');

class BatchController {
  // Create a new batch
  static async createBatch(req, res) {
    try {
      const { name, description, subject, domain } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Batch name is required'
        });
      }
      
      const batchData = {
        name,
        description,
        subject: subject || 'General',
        domain: domain || 'General',
        created_by: req.user?.id || 1,
        is_active: true
      };
      
      const batch = await Batch.create(batchData);
      
      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create batch',
        error: error.message
      });
    }
  }

  // Get all batches with filtering
  static async getBatches(req, res) {
    try {
      const {
        isActive,
        createdBy,
        subject,
        domain,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;
      
      const options = {
        sortBy,
        sortOrder
      };
      
      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }
      
      if (createdBy) {
        options.createdBy = parseInt(createdBy);
      }
      
      if (subject) {
        options.subject = subject;
      }
      
      if (domain) {
        options.domain = domain;
      }
      
      const batches = await Batch.findAll(options);
      
      res.json({
        success: true,
        data: batches,
        count: batches.length
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches',
        error: error.message
      });
    }
  }

  // Get a specific batch by ID
  static async getBatch(req, res) {
    try {
      const { id } = req.params;
      const batch = await Batch.findById(id);
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      res.json({
        success: true,
        data: batch
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch',
        error: error.message
      });
    }
  }

  // Update a batch
  static async updateBatch(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const updatedBatch = await Batch.update(id, updateData);
      
      res.json({
        success: true,
        message: 'Batch updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch',
        error: error.message
      });
    }
  }

  // Delete a batch
  static async deleteBatch(req, res) {
    try {
      const { id } = req.params;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      await Batch.delete(id);
      
      res.json({
        success: true,
        message: 'Batch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete batch',
        error: error.message
      });
    }
  }

  // Get users in a batch
  static async getBatchUsers(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.query;
      
      const options = {};
      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }
      
      const users = await Batch.getUsers(id, options);
      
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Error fetching batch users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch users',
        error: error.message
      });
    }
  }

  // Get questions in a batch
  static async getBatchQuestions(req, res) {
    try {
      const { id } = req.params;
      const { type, difficulty_level } = req.query;
      
      const options = {};
      if (type) options.type = type;
      if (difficulty_level) options.difficulty_level = difficulty_level;
      
      const questions = await Batch.getQuestions(id, options);
      
      res.json({
        success: true,
        data: questions,
        count: questions.length
      });
    } catch (error) {
      console.error('Error fetching batch questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch questions',
        error: error.message
      });
    }
  }

  // Get quizzes available to a batch
  static async getBatchQuizzes(req, res) {
    try {
      const { id } = req.params;
      
      const quizzes = await Batch.getBatchQuizzes(id);
      
      res.json({
        success: true,
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      console.error('Error fetching batch quizzes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch quizzes',
        error: error.message
      });
    }
  }

  // Update batch criteria
  static async updateBatchCriteria(req, res) {
    try {
      const { id } = req.params;
      const { criteria } = req.body;
      
      if (!criteria) {
        return res.status(400).json({
          success: false,
          message: 'Criteria object is required'
        });
      }
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const updatedBatch = await Batch.updateBatchCriteria(id, criteria);
      
      res.json({
        success: true,
        message: 'Batch criteria updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch criteria',
        error: error.message
      });
    }
  }

  // Assign user to batch
  static async assignUser(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const result = await Batch.assignUser(id, userId);
      
      if (!result) {
        return res.status(409).json({
          success: false,
          message: 'User is already assigned to this batch'
        });
      }
      
      res.json({
        success: true,
        message: 'User assigned to batch successfully'
      });
    } catch (error) {
      console.error('Error assigning user to batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign user to batch',
        error: error.message
      });
    }
  }

  // Assign question to batch
  static async assignQuestion(req, res) {
    try {
      const { id } = req.params;
      const { questionId } = req.body;
      
      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: 'Question ID is required'
        });
      }
      
      const result = await Batch.assignQuestion(id, questionId);
      
      if (!result) {
        return res.status(409).json({
          success: false,
          message: 'Question is already assigned to this batch'
        });
      }
      
      res.json({
        success: true,
        message: 'Question assigned to batch successfully'
      });
    } catch (error) {
      console.error('Error assigning question to batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign question to batch',
        error: error.message
      });
    }
  }

  // Remove user from batch
  static async removeUser(req, res) {
    try {
      const { id, userId } = req.params;
      
      await Batch.removeUser(id, userId);
      
      res.json({
        success: true,
        message: 'User removed from batch successfully'
      });
    } catch (error) {
      console.error('Error removing user from batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from batch',
        error: error.message
      });
    }
  }

  // Remove question from batch
  static async removeQuestion(req, res) {
    try {
      const { id, questionId } = req.params;
      
      await Batch.removeQuestion(id, questionId);
      
      res.json({
        success: true,
        message: 'Question removed from batch successfully'
      });
    } catch (error) {
      console.error('Error removing question from batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove question from batch',
        error: error.message
      });
    }
  }

  // Get batch statistics
  static async getBatchStatistics(req, res) {
    try {
      const { id } = req.params;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const statistics = await Batch.getStatistics(id);
      
      res.json({
        success: true,
        data: {
          batch: batch,
          statistics: statistics
        }
      });
    } catch (error) {
      console.error('Error fetching batch statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch statistics',
        error: error.message
      });
    }
  }

  // Bulk assign questions to batch
  static async bulkAssignQuestions(req, res) {
    try {
      const { id } = req.params;
      const { questionIds } = req.body;
      
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Question IDs array is required'
        });
      }
      
      const results = [];
      for (const questionId of questionIds) {
        try {
          const result = await Batch.assignQuestion(id, questionId);
          results.push({ questionId, success: result });
        } catch (error) {
          results.push({ questionId, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        message: `${successCount} of ${questionIds.length} questions assigned successfully`,
        data: results
      });
    } catch (error) {
      console.error('Error bulk assigning questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk assign questions',
        error: error.message
      });
    }
  }

  /**
   * Get available criteria options for batch creation dropdowns
   * GET /api/batches/criteria-options
   */
  static async getCriteriaOptions(req, res) {
    try {
      console.log('📊 [BatchController] Getting criteria options for batch creation...');
      
      // Get distinct values from questions table for dropdown population
      const [
        sources,
        difficultyLevels,
        domains,
        subjects,
        questionTypes
      ] = await Promise.all([
        // Get all distinct sources with question count
        db('questions')
          .select('source')
          .count('* as count')
          .whereNotNull('source')
          .groupBy('source')
          .orderBy('source'),
        
        // Get all distinct difficulty levels with question count  
        db('questions')
          .select('difficulty_level')
          .count('* as count')
          .whereNotNull('difficulty_level')
          .groupBy('difficulty_level')
          .orderBy(
            db.raw(`
              CASE difficulty_level 
                WHEN 'Easy' THEN 1
                WHEN 'Medium' THEN 2  
                WHEN 'Hard' THEN 3
                ELSE 4
              END
            `)
          ),
        
        // Get all distinct domains with question count
        db('questions')
          .select('domain')
          .count('* as count')
          .whereNotNull('domain')
          .groupBy('domain')
          .orderBy('domain'),
        
        // Get all distinct subjects with question count
        db('questions')
          .select('subject')
          .count('* as count')
          .whereNotNull('subject')
          .groupBy('subject')
          .orderBy('subject'),
          
        // Get all distinct question types with question count
        db('questions')
          .select('type')
          .count('* as count')
          .whereNotNull('type')
          .groupBy('type')
          .orderBy('type')
      ]);

      // Get total questions count for reference
      const totalQuestionsResult = await db('questions').count('* as total').first();
      const totalQuestions = parseInt(totalQuestionsResult.total);

      console.log(`✅ [BatchController] Retrieved criteria options:`, {
        sources: sources.length,
        difficultyLevels: difficultyLevels.length,
        domains: domains.length,
        subjects: subjects.length,
        questionTypes: questionTypes.length,
        totalQuestions
      });

      res.json({
        success: true,
        data: {
          sources: sources.map(item => ({
            value: item.source,
            label: item.source,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
          })),
          difficulty_levels: difficultyLevels.map(item => ({
            value: item.difficulty_level,
            label: item.difficulty_level,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
          })),
          domains: domains.map(item => ({
            value: item.domain,
            label: item.domain,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
          })),
          subjects: subjects.map(item => ({
            value: item.subject,
            label: item.subject,
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
          })),
          question_types: questionTypes.map(item => ({
            value: item.type,
            label: item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: parseInt(item.count),
            percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
          })),
          // Predefined minimum question options
          min_questions_options: [
            { value: 1, label: '1+ questions' },
            { value: 3, label: '3+ questions' },
            { value: 5, label: '5+ questions' },
            { value: 10, label: '10+ questions' },
            { value: 20, label: '20+ questions' }
          ],
          // Summary statistics
          summary: {
            total_questions: totalQuestions,
            last_updated: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('❌ [BatchController] Error getting criteria options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch criteria options',
        error: error.message
      });
    }
  }

  /**
   * Validate batch criteria against available options
   * POST /api/batches/validate-criteria  
   */
  static async validateCriteria(req, res) {
    try {
      const { criteria } = req.body;
      
      if (!criteria || typeof criteria !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Criteria object is required'
        });
      }

      console.log('🔍 [BatchController] Validating criteria:', criteria);
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        matchingQuestions: 0,
        breakdown: {}
      };

      // Build query to check how many questions match the criteria
      let query = db('questions').select('*');
      
      // Apply criteria filters and validate values exist
      if (criteria.sources && criteria.sources.length > 0) {
        const validSources = await db('questions')
          .distinct('source')
          .whereIn('source', criteria.sources)
          .whereNotNull('source');
          
        const invalidSources = criteria.sources.filter(source => 
          !validSources.some(vs => vs.source === source)
        );
        
        if (invalidSources.length > 0) {
          validation.errors.push(`Invalid sources: ${invalidSources.join(', ')}`);
          validation.isValid = false;
        } else {
          query = query.whereIn('source', criteria.sources);
        }
      }

      if (criteria.difficulty_levels && criteria.difficulty_levels.length > 0) {
        const validDifficulties = await db('questions')
          .distinct('difficulty_level')
          .whereIn('difficulty_level', criteria.difficulty_levels)
          .whereNotNull('difficulty_level');
          
        const invalidDifficulties = criteria.difficulty_levels.filter(diff => 
          !validDifficulties.some(vd => vd.difficulty_level === diff)
        );
        
        if (invalidDifficulties.length > 0) {
          validation.errors.push(`Invalid difficulty levels: ${invalidDifficulties.join(', ')}`);
          validation.isValid = false;
        } else {
          query = query.whereIn('difficulty_level', criteria.difficulty_levels);
        }
      }

      if (criteria.domains && criteria.domains.length > 0) {
        const validDomains = await db('questions')
          .distinct('domain')
          .whereIn('domain', criteria.domains)
          .whereNotNull('domain');
          
        const invalidDomains = criteria.domains.filter(domain => 
          !validDomains.some(vd => vd.domain === domain)
        );
        
        if (invalidDomains.length > 0) {
          validation.errors.push(`Invalid domains: ${invalidDomains.join(', ')}`);
          validation.isValid = false;
        } else {
          query = query.whereIn('domain', criteria.domains);
        }
      }

      if (criteria.subjects && criteria.subjects.length > 0) {
        const validSubjects = await db('questions')
          .distinct('subject')
          .whereIn('subject', criteria.subjects)
          .whereNotNull('subject');
          
        const invalidSubjects = criteria.subjects.filter(subject => 
          !validSubjects.some(vs => vs.subject === subject)
        );
        
        if (invalidSubjects.length > 0) {
          validation.errors.push(`Invalid subjects: ${invalidSubjects.join(', ')}`);
          validation.isValid = false;
        } else {
          query = query.whereIn('subject', criteria.subjects);
        }
      }

      // Only execute query if validation passed so far
      if (validation.isValid) {
        const matchingQuestions = await query;
        validation.matchingQuestions = matchingQuestions.length;
        
        // Check minimum questions requirement
        if (criteria.min_questions && validation.matchingQuestions < criteria.min_questions) {
          validation.warnings.push(
            `Only ${validation.matchingQuestions} questions match criteria, but minimum required is ${criteria.min_questions}`
          );
        }
        
        // Provide breakdown by criteria
        if (validation.matchingQuestions > 0) {
          const [sourceBreakdown, difficultyBreakdown, domainBreakdown, subjectBreakdown] = await Promise.all([
            db('questions')
              .select('source')
              .count('* as count')
              .whereIn('id', matchingQuestions.map(q => q.id))
              .groupBy('source'),
            db('questions')
              .select('difficulty_level')
              .count('* as count')
              .whereIn('id', matchingQuestions.map(q => q.id))
              .groupBy('difficulty_level'),
            db('questions')
              .select('domain')
              .count('* as count')
              .whereIn('id', matchingQuestions.map(q => q.id))
              .groupBy('domain'),
            db('questions')
              .select('subject')
              .count('* as count')
              .whereIn('id', matchingQuestions.map(q => q.id))
              .groupBy('subject')
          ]);
          
          validation.breakdown = {
            bySources: sourceBreakdown,
            byDifficulty: difficultyBreakdown,  
            byDomains: domainBreakdown,
            bySubjects: subjectBreakdown
          };
        }
      }

      console.log(`✅ [BatchController] Criteria validation completed:`, {
        isValid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        matchingQuestions: validation.matchingQuestions
      });

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      console.error('❌ [BatchController] Error validating criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate criteria',
        error: error.message
      });
    }
  }

  /**
   * Preview questions that match given criteria  
   * POST /api/batches/preview-questions
   */
  static async previewCriteriaQuestions(req, res) {
    try {
      const { criteria, limit = 10 } = req.body;
      
      if (!criteria || typeof criteria !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Criteria object is required'
        });
      }

      console.log('🔍 [BatchController] Previewing questions for criteria:', criteria);
      
      // Build query to get matching questions
      let query = db('questions')
        .select(
          'id', 
          'question_text', 
          'source', 
          'difficulty_level', 
          'domain', 
          'subject', 
          'type',
          'created_at'
        );
      
      // Apply criteria filters
      if (criteria.sources && criteria.sources.length > 0) {
        query = query.whereIn('source', criteria.sources);
      }

      if (criteria.difficulty_levels && criteria.difficulty_levels.length > 0) {
        query = query.whereIn('difficulty_level', criteria.difficulty_levels);
      }

      if (criteria.domains && criteria.domains.length > 0) {
        query = query.whereIn('domain', criteria.domains);
      }

      if (criteria.subjects && criteria.subjects.length > 0) {
        query = query.whereIn('subject', criteria.subjects);
      }

      // Get total count first
      const totalCount = await query.clone().count('* as count').first();
      
      // Get limited preview
      const previewQuestions = await query
        .orderBy('created_at', 'desc')
        .limit(parseInt(limit));

      console.log(`✅ [BatchController] Found ${totalCount.count} matching questions, showing ${previewQuestions.length}`);

      res.json({
        success: true,
        data: {
          total_matching: parseInt(totalCount.count),
          preview_count: previewQuestions.length,
          questions: previewQuestions.map(q => ({
            ...q,
            question_preview: q.question_text.length > 100 
              ? q.question_text.substring(0, 100) + '...'
              : q.question_text
          })),
          criteria_applied: criteria
        }
      });

    } catch (error) {
      console.error('❌ [BatchController] Error previewing questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview questions',
        error: error.message
      });
    }
  }
}

module.exports = BatchController;
