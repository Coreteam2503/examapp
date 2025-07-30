const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');
const { db } = require('../config/database');
const Joi = require('joi');

class QuizGenerationService {
  constructor() {
    // Define validation schema for quiz generation criteria
    this.criteriaSchema = Joi.object({
      domain: Joi.string().max(255).allow('').optional(),
      subject: Joi.string().max(255).allow('').optional(),
      source: Joi.string().max(255).allow('').optional(),
      difficulty_level: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
      type: Joi.string().valid(
        'multiple_choice', 'fill_blank', 'fill_in_the_blank', 'true_false', 
        'matching', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid'
      ).optional(),
      game_format: Joi.string().valid(
        'traditional', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid'
      ).default('hangman'),
      num_questions: Joi.number().integer().min(1).max(50).default(10),
      time_limit: Joi.number().integer().min(1).max(180).default(30),
      randomSeed: Joi.number().optional(),
      excludeQuestionIds: Joi.array().items(Joi.number().integer()).default([]),
      userId: Joi.number().integer().optional(),
      batchIds: Joi.array().items(Joi.number().integer()).optional()
    });
  }

  /**
   * Get or create system upload ID for dynamic quizzes
   */
  async _getSystemUploadId() {
    const systemUpload = await db('uploads')
      .where('filename', 'SYSTEM_DYNAMIC_QUIZ')
      .first();
    
    if (systemUpload) {
      return systemUpload.id;
    }
    
    // If not found, create it
    const result = await db('uploads').insert({
      user_id: 1,
      filename: 'SYSTEM_DYNAMIC_QUIZ',
      original_name: 'Dynamic Quiz Generation System',
      file_path: 'system/dynamic_quiz_generation',
      file_type: 'application/json',
      mime_type: 'application/json',
      file_size: 0,
      content: JSON.stringify({
        system: true,
        purpose: 'Dynamic quiz generation from question bank'
      }),
      status: 'completed'
    }).returning('id');
    
    const uploadId = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return uploadId;
  }

  validateCriteria(criteria) {
    const { error, value } = this.criteriaSchema.validate(criteria, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new QuizGenerationError('Invalid criteria', error.details);
    }

    return value;
  }

  /**
   * Generate a criteria-based quiz (stores criteria, not fixed questions)
   */
  async generateCriteriaBasedQuiz(criteria, userId) {
    console.log('🎯 [QuizGenerationService] Starting criteria-based quiz generation:', criteria);
    
    // Validate criteria
    const validatedCriteria = this.validateCriteria(criteria);
    
    // Build criteria object for storage
    const storedCriteria = {};
    if (validatedCriteria.domain) storedCriteria.domain = validatedCriteria.domain;
    if (validatedCriteria.subject) storedCriteria.subject = validatedCriteria.subject;
    if (validatedCriteria.source) storedCriteria.source = validatedCriteria.source;
    if (validatedCriteria.difficulty_level) storedCriteria.difficulty_level = validatedCriteria.difficulty_level;
    
    console.log('📋 [QuizGenerationService] Criteria to store:', storedCriteria);
    
    // Validate that questions exist for these criteria
    const questionSelector = require('./questionSelector');
    const availableQuestions = await questionSelector.selectQuestionsForQuiz(
      storedCriteria,
      validatedCriteria.num_questions
    );
    
    if (availableQuestions.length === 0) {
      throw new QuizGenerationError(
        'No questions available',
        `No questions found matching the specified criteria: ${JSON.stringify(storedCriteria)}`
      );
    }
    
    if (availableQuestions.length < validatedCriteria.num_questions) {
      console.warn(`⚠️ Only ${availableQuestions.length} questions available, requested ${validatedCriteria.num_questions}`);
    }
    
    // Get system upload ID for dynamic quizzes
    const systemUploadId = await this._getSystemUploadId();
    
    // Create quiz record with criteria (not fixed questions)
    const quizData = {
      upload_id: systemUploadId,
      created_by: userId,
      title: this._generateQuizTitle(validatedCriteria),
      description: this._generateQuizDescription(validatedCriteria),
      difficulty: validatedCriteria.difficulty_level?.toLowerCase() || 'medium',
      time_limit: validatedCriteria.time_limit || 30,
      game_format: validatedCriteria.game_format || 'traditional',
      is_active: true,
      
      // NEW: Store criteria instead of fixed questions
      criteria: storedCriteria,
      question_count: Math.min(validatedCriteria.num_questions, availableQuestions.length),
      
      metadata: JSON.stringify({
        generation_criteria: validatedCriteria,
        generated_at: new Date().toISOString(),
        available_questions_count: availableQuestions.length,
        is_criteria_based: true,
        question_preview: availableQuestions.slice(0, 3).map(q => ({
          id: q.id,
          type: q.type,
          difficulty: q.difficulty_level,
          domain: q.domain,
          subject: q.subject
        }))
      })
    };
    
    console.log('💾 [QuizGenerationService] Creating quiz with criteria:', {
      criteria: storedCriteria,
      question_count: quizData.question_count,
      available_questions: availableQuestions.length
    });
    
    const quiz = await Quiz.create(quizData);
    console.log(`🎉 [QuizGenerationService] Created criteria-based quiz with ID: ${quiz.id}`);
    
    return {
      quiz: {
        ...quiz,
        questions_preview: availableQuestions.slice(0, 5),
        total_available_questions: availableQuestions.length,
        is_criteria_based: true
      },
      metadata: {
        generation_type: 'criteria_based',
        criteria: storedCriteria,
        available_questions: availableQuestions.length,
        preview_count: Math.min(5, availableQuestions.length)
      }
    };
  }

  /**
   * Get available options for quiz generation dropdowns
   * Returns distinct values with counts from the questions table for UI dropdowns
   */
  async getAvailableOptions() {
    try {
      console.log('📊 [QuizGenerationService] Fetching available generation options...');
      
      const [domains, subjects, sources, difficulties, types, gameFormats] = await Promise.all([
        db('questions')
          .select('domain')
          .count('* as count')
          .whereNotNull('domain')
          .where('domain', '!=', '')
          .groupBy('domain')
          .orderBy('domain'),
          
        db('questions')
          .select('subject')
          .count('* as count')
          .whereNotNull('subject')
          .where('subject', '!=', '')
          .groupBy('subject')
          .orderBy('subject'),
          
        db('questions')
          .select('source')
          .count('* as count')
          .whereNotNull('source')
          .where('source', '!=', '')
          .groupBy('source')
          .orderBy('source'),
          
        db('questions')
          .select('difficulty_level')
          .count('* as count')
          .whereNotNull('difficulty_level')
          .groupBy('difficulty_level')
          .orderBy('difficulty_level'),
          
        db('questions')
          .select('type')
          .count('* as count')
          .whereNotNull('type')
          .groupBy('type')
          .orderBy('type'),
          
        // Get game formats from quizzes table (actual usage) or fall back to validation schema
        db('quizzes')
          .select('game_format')
          .count('* as count')
          .whereNotNull('game_format')
          .groupBy('game_format')
          .orderBy('game_format')
      ]);

      // If no game formats found in quizzes table, use the ones from our validation schema
      let gameFormatsResult = gameFormats;
      if (gameFormats.length === 0) {
        console.log('🎮 [QuizGenerationService] No game formats found in quizzes, using validation schema defaults');
        const validGameFormats = this.criteriaSchema.describe().keys.game_format.allow;
        gameFormatsResult = validGameFormats.map(format => ({
          game_format: format,
          count: 0
        }));
      }

      const options = {
        domains: domains.map(d => ({ 
          domain: d.domain, 
          count: parseInt(d.count) 
        })),
        subjects: subjects.map(s => ({ 
          subject: s.subject, 
          count: parseInt(s.count) 
        })),
        sources: sources.map(s => ({ 
          source: s.source, 
          count: parseInt(s.count) 
        })),
        difficulties: difficulties.map(d => ({ 
          difficulty_level: d.difficulty_level, 
          count: parseInt(d.count) 
        })),
        types: types.map(t => ({ 
          type: t.type, 
          count: parseInt(t.count) 
        })),
        gameFormats: gameFormatsResult.map(g => ({
          game_format: g.game_format,
          count: parseInt(g.count || 0)
        }))
      };

      console.log('✅ [QuizGenerationService] Generation options fetched:', {
        domains: options.domains.length,
        subjects: options.subjects.length,
        sources: options.sources.length,
        difficulties: options.difficulties.length,
        types: options.types.length,
        gameFormats: options.gameFormats.length
      });

      return options;
    } catch (error) {
      console.error('❌ [QuizGenerationService] Error fetching generation options:', error);
      throw new Error('Failed to fetch generation options');
    }
  }

  /**
   * Preview questions for given criteria without creating a quiz
   */
  async previewQuestionsForCriteria(criteria, limit = 10) {
    console.log('👁️ [QuizGenerationService] Previewing questions for criteria:', criteria);
    
    // Validate criteria
    const validatedCriteria = this.validateCriteria(criteria);
    
    // Build criteria object
    const storedCriteria = {};
    if (validatedCriteria.domain) storedCriteria.domain = validatedCriteria.domain;
    if (validatedCriteria.subject) storedCriteria.subject = validatedCriteria.subject;
    if (validatedCriteria.source) storedCriteria.source = validatedCriteria.source;
    if (validatedCriteria.difficulty_level) storedCriteria.difficulty_level = validatedCriteria.difficulty_level;
    
    // Get preview questions
    const questionSelector = require('./questionSelector');
    const preview = await questionSelector.previewSelection(storedCriteria, limit);
    
    return {
      criteria: storedCriteria,
      total_matching: preview.totalMatching,
      sample_questions: preview.sampleQuestions.map(q => ({
        id: q.id,
        type: q.type,
        question_text: q.question_text.substring(0, 100) + '...',
        difficulty_level: q.difficulty_level,
        domain: q.domain,
        subject: q.subject,
        source: q.source
      })),
      has_more: preview.hasMore
    };
  }

  /**
   * Generate quiz title based on criteria
   */
  _generateQuizTitle(criteria) {
    const parts = ['Dynamic Quiz'];
    
    if (criteria.domain && criteria.domain !== 'General') {
      parts.push(`- ${criteria.domain}`);
    }
    
    if (criteria.subject && criteria.subject !== 'General') {
      parts.push(`- ${criteria.subject}`);
    }
    
    if (criteria.difficulty_level) {
      parts.push(`(${criteria.difficulty_level})`);
    }
    
    return parts.join(' ');
  }

  /**
   * Generate quiz description
   */
  _generateQuizDescription(criteria) {
    const parts = [`A dynamically generated quiz with ${criteria.num_questions} questions`];
    
    const filters = [];
    if (criteria.domain) filters.push(`Domain: ${criteria.domain}`);
    if (criteria.subject) filters.push(`Subject: ${criteria.subject}`);
    if (criteria.difficulty_level) filters.push(`Difficulty: ${criteria.difficulty_level}`);
    
    if (filters.length > 0) {
      parts.push(`Filtered by: ${filters.join(', ')}`);
    }
    
    return parts.join('. ');
  }
}

// Custom error class for quiz generation
class QuizGenerationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'QuizGenerationError';
    this.details = details;
  }
}

module.exports = { QuizGenerationService, QuizGenerationError };
