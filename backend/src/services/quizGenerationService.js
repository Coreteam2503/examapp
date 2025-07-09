const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
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
      ).default('hangman'), // Default to hangman instead of traditional
      num_questions: Joi.number().integer().min(1).max(50).default(10),
      randomSeed: Joi.number().optional(),
      excludeQuestionIds: Joi.array().items(Joi.number().integer()).default([])
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

    // Convert deprecated game formats to hangman
    if (value.game_format === 'traditional' || value.game_format === 'memory_grid') {
      console.log(`🔄 [QuizGenerationService] Converting deprecated game format '${value.game_format}' to 'hangman'`);
      value.game_format = 'hangman';
    }

    return value;
  }

  /**
   * Generate a dynamic quiz based on criteria
   */
  async generateQuiz(criteria, userId) {
    console.log('🎯 [QuizGenerationService] Starting quiz generation with criteria:', criteria);
    
    // Validate criteria
    const validatedCriteria = this.validateCriteria(criteria);
    
    // Build filter object for question search
    const filters = this._buildFilters(validatedCriteria);
    console.log('🔍 [QuizGenerationService] Built filters:', filters);
    
    // Find matching questions
    const availableQuestions = await Question.searchWithFilters(filters, {
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    console.log(`📊 [QuizGenerationService] Found ${availableQuestions.length} available questions`);
    
    // Check if we have enough questions
    if (availableQuestions.length < validatedCriteria.num_questions) {
      throw new QuizGenerationError(
        'Insufficient questions',
        `Only ${availableQuestions.length} questions available, but ${validatedCriteria.num_questions} requested`
      );
    }
    
    // Exclude specific questions if requested
    const filteredQuestions = availableQuestions.filter(
      q => !validatedCriteria.excludeQuestionIds.includes(q.id)
    );
    
    if (filteredQuestions.length < validatedCriteria.num_questions) {
      throw new QuizGenerationError(
        'Insufficient questions after exclusions',
        `Only ${filteredQuestions.length} questions available after exclusions`
      );
    }
    
    // Select questions using random selection algorithm
    const selectedQuestions = this._selectQuestions(
      filteredQuestions, 
      validatedCriteria.num_questions,
      validatedCriteria.randomSeed
    );
    
    console.log(`✅ [QuizGenerationService] Selected ${selectedQuestions.length} questions`);
    
    // Get system upload ID for dynamic quizzes
    const systemUploadId = await this._getSystemUploadId();
    
    // Create quiz record
    const quizData = {
      upload_id: systemUploadId, // Use system upload for dynamic quizzes
      title: this._generateQuizTitle(validatedCriteria),
      description: this._generateQuizDescription(validatedCriteria),
      game_format: validatedCriteria.game_format,
      game_options: this._generateGameOptions(validatedCriteria),
      created_by: userId,
      user_id: userId, // Also set user_id for compatibility
      is_active: true,
      total_questions: validatedCriteria.num_questions,
      metadata: JSON.stringify({
        generation_criteria: validatedCriteria,
        generated_at: new Date().toISOString(),
        question_sources: this._analyzeQuestionSources(selectedQuestions),
        is_dynamic: true
      })
    };
    
    const quiz = await Quiz.create(quizData);
    console.log(`🎉 [QuizGenerationService] Created quiz with ID: ${quiz.id}`);
    
    console.log('🔍 DEBUG - About to create junction table associations (NOT copying questions)');
    
    // Instead of copying questions, create associations in junction table
    const quizQuestionAssociations = selectedQuestions.map((question, index) => ({
      quiz_id: quiz.id,
      question_id: question.id,
      question_number: index + 1,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    console.log('🔍 DEBUG - Junction table associations:', quizQuestionAssociations);
    
    await db('quiz_questions').insert(quizQuestionAssociations);
    console.log(`📝 [QuizGenerationService] Associated ${selectedQuestions.length} questions with quiz ${quiz.id}`);
    
    // Format response for frontend
    const formattedQuiz = await this._formatQuizForFrontend(quiz, selectedQuestions);
    
    return formattedQuiz;
  }

  /**
   * Get available options for quiz generation (domains, subjects, sources)
   */
  async getAvailableOptions() {
    console.log('📊 [QuizGenerationService] Getting available options...');
    
    const statistics = await Question.getStatistics();
    
    return {
      domains: statistics.byDomain.map(d => ({
        domain: d.domain,
        count: d.count
      })),
      subjects: statistics.bySubject.map(s => ({
        subject: s.subject,
        count: s.count
      })),
      sources: statistics.bySource.map(s => ({
        source: s.source,
        count: s.count
      })),
      difficulties: statistics.byDifficulty.map(d => ({
        difficulty_level: d.difficulty_level,
        count: d.count
      })),
      types: statistics.byType.map(t => ({
        type: t.type,
        count: t.count
      })),
      gameFormats: [
        { value: 'traditional', label: 'Traditional Quiz', supported: true },
        { value: 'hangman', label: 'Hangman Game', supported: true },
        { value: 'knowledge_tower', label: 'Knowledge Tower', supported: true },
        { value: 'word_ladder', label: 'Word Ladder', supported: true },
        { value: 'memory_grid', label: 'Memory Grid', supported: true }
      ]
    };
  }

  /**
   * Build filters object from criteria
   */
  _buildFilters(criteria) {
    const filters = {};
    
    if (criteria.domain) filters.domain = criteria.domain;
    if (criteria.subject) filters.subject = criteria.subject;
    if (criteria.source) filters.source = criteria.source;
    if (criteria.difficulty_level) filters.difficulty_level = criteria.difficulty_level;
    if (criteria.difficulty) filters.difficulty = criteria.difficulty;
    if (criteria.type) filters.type = criteria.type;
    
    return filters;
  }

  /**
   * Select questions using fair random selection
   */
  _selectQuestions(questions, numQuestions, seed = null) {
    // Create a copy to avoid modifying the original array
    const shuffled = [...questions];
    
    // Use deterministic shuffle if seed provided, otherwise random
    if (seed !== null) {
      this._seededShuffle(shuffled, seed);
    } else {
      this._fisherYatesShuffle(shuffled);
    }
    
    return shuffled.slice(0, numQuestions);
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  _fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Seeded shuffle for reproducible results
   */
  _seededShuffle(array, seed) {
    const rng = this._createSeededRNG(seed);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Create seeded random number generator
   */
  _createSeededRNG(seed) {
    let state = seed;
    return function() {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
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

  /**
   * Generate game-specific options
   */
  _generateGameOptions(criteria) {
    const options = {
      difficulty: criteria.difficulty_level || 'Medium',
      timeLimit: null, // Can be added later
      randomOrder: true
    };
    
    switch (criteria.game_format) {
      case 'hangman':
        options.maxAttempts = 6;
        options.showHints = true;
        break;
        
      case 'knowledge_tower':
        options.levelsRequired = criteria.num_questions;
        options.allowSkip = false;
        break;
        
      case 'word_ladder':
        options.stepLimit = criteria.num_questions * 2;
        options.showProgress = true;
        break;
        
      case 'memory_grid':
        options.gridSize = Math.min(6, Math.ceil(Math.sqrt(criteria.num_questions)));
        options.revealTime = 3000;
        break;
    }
    
    return JSON.stringify(options);
  }

  /**
   * Analyze question sources for metadata
   */
  _analyzeQuestionSources(questions) {
    const sources = {};
    const domains = {};
    const difficulties = {};
    
    questions.forEach(q => {
      sources[q.source] = (sources[q.source] || 0) + 1;
      domains[q.domain] = (domains[q.domain] || 0) + 1;
      difficulties[q.difficulty_level] = (difficulties[q.difficulty_level] || 0) + 1;
    });
    
    return { sources, domains, difficulties };
  }

  /**
   * Format quiz for frontend consumption
   */
  async _formatQuizForFrontend(quiz, questions) {
    const formattedQuestions = questions.map((q, index) => ({
      id: q.id,
      question_number: index + 1,
      type: q.type,
      question_text: q.question_text,
      options: q.options ? this._parseOptionsField(q.options) : null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      hint: q.hint,
      difficulty: q.difficulty_level,
      domain: q.domain,
      subject: q.subject,
      weightage: q.weightage
    }));
    
    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        game_format: quiz.game_format,
        game_options: quiz.game_options ? JSON.parse(quiz.game_options) : {},
        created_at: quiz.created_at,
        question_count: questions.length
      },
      questions: formattedQuestions,
      metadata: {
        generated_dynamically: true,
        generation_timestamp: new Date().toISOString(),
        criteria_used: this._sanitizeCriteria(quiz.metadata)
      }
    };
  }

  /**
   * Safely parse options field - handles both JSON and plain text formats
   */
  _parseOptionsField(options) {
    if (!options) return null;
    
    // If it's already an object/array, return as is
    if (typeof options !== 'string') return options;
    
    // Try to parse as JSON first (for older questions)
    try {
      return JSON.parse(options);
    } catch (e) {
      // If JSON parsing fails, return as plain text string (new format)
      return options;
    }
  }

  /**
   * Sanitize criteria for frontend
   */
  _sanitizeCriteria(metadata) {
    try {
      const parsed = JSON.parse(metadata || '{}');
      return parsed.generation_criteria || {};
    } catch {
      return {};
    }
  }

  /**
   * Get or create system upload ID for dynamic quizzes
   */
  async _getSystemUploadId() {
    const { db } = require('../config/database');
    
    // Check if system upload already exists
    const existingSystemUpload = await db('uploads')
      .where('filename', 'dynamic-quiz-system.txt')
      .first();
    
    if (existingSystemUpload) {
      return existingSystemUpload.id;
    }
    
    // Create system upload if it doesn't exist
    const result = await db('uploads').insert({
      user_id: 1, // System user
      filename: 'dynamic-quiz-system.txt',
      original_name: 'Dynamic Quiz System',
      file_path: '/system/dynamic-quiz-placeholder.txt',
      content: 'System placeholder for dynamically generated quizzes. This upload represents questions generated from the question bank.',
      file_size: 125,
      file_type: '.txt',
      mime_type: 'text/plain',
      status: 'completed',
      upload_date: Date.now(),
      processed_date: Date.now()
    }).returning('id');
    
    const uploadId = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    
    return uploadId;
  }

  /**
   * Format type label for display
   */
  _formatTypeLabel(type) {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False', 
      'fill_blank': 'Fill in the Blank',
      'fill_in_the_blank': 'Fill in the Blank',
      'matching': 'Matching',
      'hangman': 'Hangman',
      'knowledge_tower': 'Knowledge Tower',
      'word_ladder': 'Word Ladder',
      'memory_grid': 'Memory Grid'
    };
    
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
