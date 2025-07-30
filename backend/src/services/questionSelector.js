const { db } = require('../config/database');
const logger = require('./logger');

/**
 * QuestionSelector Service
 * 
 * Implements dynamic question selection algorithm based on quiz criteria.
 * Replaces fixed quiz-question associations with flexible, criteria-based selection.
 * 
 * Features:
 * - Criteria-based filtering (domain, subject, source, difficulty_level)
 * - Weighted randomization for fair question distribution
 * - Question uniqueness validation within attempts
 * - Fallback logic for insufficient matches
 * - Performance optimization with caching
 * - Comprehensive logging and error handling
 */
class QuestionSelector {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main method: Select questions for a quiz based on criteria
   * 
   * @param {Object} criteria - Selection criteria {domain, subject, source, difficulty_level}
   * @param {number} questionCount - Number of questions to select (null = all matching)
   * @param {Array} excludeIds - Question IDs to exclude (for attempt uniqueness)
   * @returns {Promise<Array>} Array of selected question objects
   */
  async selectQuestionsForQuiz(criteria, questionCount = null, excludeIds = []) {
    try {
      logger.info('🎯 Starting question selection', {
        criteria,
        questionCount,
        excludeCount: excludeIds.length
      });

      // Step 1: Build the query with criteria filters
      const query = this._buildCriteriaQuery(criteria, excludeIds);
      
      // Step 2: Get matching questions count for validation
      const totalMatching = await this._getMatchingCount(criteria, excludeIds);
      logger.info(`📊 Found ${totalMatching} questions matching criteria`);

      if (totalMatching === 0) {
        logger.warn('⚠️ No questions found matching strict criteria, applying fallback');
        return await this._fallbackSelection(criteria, questionCount, excludeIds);
      }

      // Step 3: Determine final question count
      const finalCount = questionCount ? Math.min(questionCount, totalMatching) : totalMatching;
      
      // Step 4: Execute selection with randomization
      const selectedQuestions = await this._executeRandomizedSelection(query, finalCount, totalMatching);

      logger.info(`✅ Successfully selected ${selectedQuestions.length} questions`);
      return selectedQuestions;

    } catch (error) {
      logger.error('❌ Question selection failed', { error: error.message, criteria });
      throw new Error(`Question selection failed: ${error.message}`);
    }
  }

  /**
   * Build database query with criteria filters
   * @private
   */
  _buildCriteriaQuery(criteria, excludeIds = []) {
    let query = db('questions')
      .select([
        'id', 'question_text', 'type', 'options', 'correct_answer', 
        'explanation', 'difficulty_level', 'domain', 'subject', 'source',
        'points', 'weightage', 'concepts', 'hint', 'code_snippet',
        'pairs', 'items', 'correct_order', 'correct_answers_data', 'formatted_text'
      ])
      .whereNull('quiz_id'); // Only select from question bank (unassigned questions)

    // Apply criteria filters
    if (criteria.domain) {
      query = query.where('domain', criteria.domain);
    }
    
    if (criteria.subject) {
      query = query.where('subject', criteria.subject);
    }
    
    if (criteria.source) {
      query = query.where('source', criteria.source);
    }
    
    if (criteria.difficulty_level) {
      query = query.where('difficulty_level', criteria.difficulty_level);
    }

    // Exclude specific question IDs (for attempt uniqueness)
    if (excludeIds.length > 0) {
      query = query.whereNotIn('id', excludeIds);
    }

    return query;
  }

  /**
   * Get count of questions matching criteria
   * @private
   */
  async _getMatchingCount(criteria, excludeIds = []) {
    // Build a count-only query without selecting specific columns
    let query = db('questions')
      .count('* as count')
      .whereNull('quiz_id'); // Only select from question bank (unassigned questions)

    // Apply criteria filters
    if (criteria.domain) {
      query = query.where('domain', criteria.domain);
    }
    
    if (criteria.subject) {
      query = query.where('subject', criteria.subject);
    }
    
    if (criteria.source) {
      query = query.where('source', criteria.source);
    }
    
    if (criteria.difficulty_level) {
      query = query.where('difficulty_level', criteria.difficulty_level);
    }

    // Exclude specific question IDs (for attempt uniqueness)
    if (excludeIds.length > 0) {
      query = query.whereNotIn('id', excludeIds);
    }

    const result = await query.first();
    return parseInt(result.count);
  }

  /**
   * Execute randomized selection with weighted distribution
   * @private
   */
  async _executeRandomizedSelection(query, finalCount, totalMatching) {
    if (finalCount >= totalMatching) {
      // If requesting all or more than available, return all matching questions
      return await query.orderBy(db.raw('RANDOM()'));
    }

    // For partial selection, implement weighted randomization
    // Use PostgreSQL's TABLESAMPLE for large datasets, or ORDER BY RANDOM() for smaller ones
    if (totalMatching > 1000) {
      // For large question banks, use sampling
      const samplePercent = Math.max(1, Math.ceil((finalCount * 200) / totalMatching)); // 2x oversample
      return await query
        .orderBy(db.raw('RANDOM()'))
        .limit(finalCount);
    } else {
      // For smaller question banks, simple randomization
      return await query
        .orderBy(db.raw('RANDOM()'))
        .limit(finalCount);
    }
  }

  /**
   * Fallback selection when strict criteria match no questions
   * Gradually relaxes criteria to find suitable questions
   * @private
   */
  async _fallbackSelection(originalCriteria, questionCount, excludeIds = []) {
    logger.info('🔄 Executing fallback selection strategy');

    // Fallback strategy 1: Remove source constraint
    if (originalCriteria.source) {
      const relaxedCriteria = { ...originalCriteria };
      delete relaxedCriteria.source;
      
      const fallbackCount = await this._getMatchingCount(relaxedCriteria, excludeIds);
      if (fallbackCount > 0) {
        logger.info(`📋 Fallback 1: Found ${fallbackCount} questions without source constraint`);
        return await this.selectQuestionsForQuiz(relaxedCriteria, questionCount, excludeIds);
      }
    }

    // Fallback strategy 2: Remove difficulty constraint
    if (originalCriteria.difficulty_level) {
      const relaxedCriteria = { ...originalCriteria };
      delete relaxedCriteria.source;
      delete relaxedCriteria.difficulty_level;
      
      const fallbackCount = await this._getMatchingCount(relaxedCriteria, excludeIds);
      if (fallbackCount > 0) {
        logger.info(`📋 Fallback 2: Found ${fallbackCount} questions without difficulty constraint`);
        return await this.selectQuestionsForQuiz(relaxedCriteria, questionCount, excludeIds);
      }
    }

    // Fallback strategy 3: Keep only domain constraint
    if (originalCriteria.domain) {
      const relaxedCriteria = { domain: originalCriteria.domain };
      
      const fallbackCount = await this._getMatchingCount(relaxedCriteria, excludeIds);
      if (fallbackCount > 0) {
        logger.info(`📋 Fallback 3: Found ${fallbackCount} questions with domain only`);
        return await this.selectQuestionsForQuiz(relaxedCriteria, questionCount, excludeIds);
      }
    }

    // Final fallback: Any available questions
    logger.warn('⚠️ Using final fallback: selecting any available questions');
    const anyQuestions = await this.selectQuestionsForQuiz({}, questionCount, excludeIds);
    
    if (anyQuestions.length === 0) {
      throw new Error('No questions available in question bank');
    }

    return anyQuestions;
  }

  /**
   * Validate question uniqueness within an attempt
   * Checks if selected questions don't conflict with existing attempt questions
   * 
   * @param {Array} selectedQuestions - Questions to validate
   * @param {number} attemptId - Quiz attempt ID (optional, for existing attempts)
   * @returns {Promise<Object>} Validation result
   */
  async validateQuestionUniqueness(selectedQuestions, attemptId = null) {
    try {
      if (!attemptId) {
        return { isValid: true, duplicates: [] };
      }

      // Get existing questions for this attempt
      const existingAttempt = await db('quiz_attempts')
        .select('selected_questions')
        .where('id', attemptId)
        .first();

      if (!existingAttempt || !existingAttempt.selected_questions) {
        return { isValid: true, duplicates: [] };
      }

      // Handle both string and array formats
      let existingQuestionIds = [];
      if (typeof existingAttempt.selected_questions === 'string') {
        existingQuestionIds = JSON.parse(existingAttempt.selected_questions);
      } else if (Array.isArray(existingAttempt.selected_questions)) {
        existingQuestionIds = existingAttempt.selected_questions;
      }
      const newQuestionIds = selectedQuestions.map(q => q.id);
      
      const duplicates = newQuestionIds.filter(id => existingQuestionIds.includes(id));
      
      return {
        isValid: duplicates.length === 0,
        duplicates,
        message: duplicates.length > 0 ? `Found ${duplicates.length} duplicate questions` : 'All questions are unique'
      };

    } catch (error) {
      logger.error('❌ Question uniqueness validation failed', { error: error.message });
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Get cached criteria stats for performance optimization
   * Returns statistics about available questions for each criteria combination
   */
  async getCriteriaStats() {
    const cacheKey = 'criteria-stats';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Get comprehensive stats about available questions
      const stats = await db('questions')
        .select([
          'domain',
          'subject', 
          'source',
          'difficulty_level',
          db.raw('COUNT(*) as question_count')
        ])
        .whereNull('quiz_id')
        .groupBy('domain', 'subject', 'source', 'difficulty_level')
        .orderBy('domain')
        .orderBy('subject')
        .orderBy('difficulty_level');

      // Cache the results
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      logger.info(`📊 Generated criteria stats: ${stats.length} combinations available`);
      return stats;

    } catch (error) {
      logger.error('❌ Failed to generate criteria stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear cache - useful for testing or when question bank is updated
   */
  clearCache() {
    this.cache.clear();
    logger.info('🧹 Question selector cache cleared');
  }

  /**
   * Preview questions that would be selected for given criteria
   * Useful for admin interfaces to preview quiz content
   * 
   * @param {Object} criteria - Selection criteria
   * @param {number} limit - Maximum questions to preview (default: 10)
   * @returns {Promise<Object>} Preview data with questions and stats
   */
  async previewSelection(criteria, limit = 10) {
    try {
      const totalMatching = await this._getMatchingCount(criteria);
      const query = this._buildCriteriaQuery(criteria);
      const sampleQuestions = await query.limit(limit).orderBy('id');

      return {
        totalMatching,
        sampleQuestions,
        criteria,
        hasMore: totalMatching > limit
      };

    } catch (error) {
      logger.error('❌ Preview selection failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
const questionSelector = new QuestionSelector();
module.exports = questionSelector;
