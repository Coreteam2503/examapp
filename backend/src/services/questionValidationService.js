const Joi = require('joi');

class QuestionValidationService {
  constructor() {
    // Define the question schema for validation
    this.questionSchema = Joi.object({
      quiz_id: Joi.number().integer().positive().optional().allow(null),
      question_number: Joi.number().integer().positive().required(),
      type: Joi.string().valid(
        'multiple_choice',
        'fill_blank', 
        'fill_in_the_blank',
        'true_false',
        'matching',
        'hangman',
        'knowledge_tower',
        'word_ladder',
        'memory_grid',
        'drag_drop_match',
        'drag_drop_order'
      ).required(),
      question_text: Joi.string().min(1).max(2000).required(),
      code_snippet: Joi.string().max(5000).allow(null, ''),
      options: Joi.string().allow(null, ''),
      correct_answer: Joi.string().allow(null, ''),
      correct_answers_data: Joi.string().allow(null, ''),
      pairs: Joi.string().allow(null, ''),
      items: Joi.string().allow(null, ''),
      correct_order: Joi.string().allow(null, ''),
      explanation: Joi.string().max(1000).allow(null, ''),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
      concepts: Joi.string().default('[]'),
      hint: Joi.string().max(500).allow(null, ''),
      hint_detailed: Joi.string().max(1000).allow(null, ''),
      formatted_text: Joi.string().allow(null, ''),
      word_data: Joi.string().allow(null, ''),
      level_number: Joi.number().integer().min(1).default(1),
      pattern_data: Joi.string().allow(null, ''),
      ladder_steps: Joi.string().allow(null, ''),
      max_attempts: Joi.number().integer().min(1).default(6),
      visual_data: Joi.string().allow(null, ''),
      
      // New question bank metadata fields
      domain: Joi.string().min(1).max(255).default('General'),
      subject: Joi.string().min(1).max(255).default('General'),
      source: Joi.string().min(1).max(255).default('Custom'),
      weightage: Joi.number().integer().min(1).max(10).default(1),
      difficulty_level: Joi.string().valid('Easy', 'Medium', 'Hard').default('Medium')
    });

    // Schema for bulk creation
    this.bulkCreateSchema = Joi.object({
      questions: Joi.array().items(this.questionSchema).min(1).max(100).required()
    });

    // Schema for search filters
    this.searchSchema = Joi.object({
      domain: Joi.string().max(255).optional(),
      subject: Joi.string().max(255).optional(),
      source: Joi.string().max(255).optional(),
      difficulty_level: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
      type: Joi.string().valid(
        'multiple_choice',
        'fill_blank', 
        'fill_in_the_blank',
        'true_false',
        'matching',
        'hangman',
        'knowledge_tower',
        'word_ladder',
        'memory_grid',
        'drag_drop_match',
        'drag_drop_order'
      ).optional(),
      weightage: Joi.number().integer().min(1).max(10).optional(),
      search: Joi.string().max(255).optional(),
      sortBy: Joi.string().valid(
        'created_at', 'updated_at', 'question_text', 'domain', 
        'subject', 'difficulty_level', 'weightage'
      ).default('created_at'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0)
    });
  }

  /**
   * Validate a single question
   */
  validateQuestion(questionData) {
    const { error, value } = this.questionSchema.validate(questionData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new ValidationError('Question validation failed', error.details);
    }

    return value;
  }

  /**
   * Validate bulk question creation data
   */
  validateBulkCreate(data) {
    const { error, value } = this.bulkCreateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new ValidationError('Bulk creation validation failed', error.details);
    }

    return value;
  }

  /**
   * Validate search parameters
   */
  validateSearch(searchParams) {
    const { error, value } = this.searchSchema.validate(searchParams, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new ValidationError('Search parameters validation failed', error.details);
    }

    return value;
  }

  /**
   * Validate that question data is consistent
   */
  validateQuestionLogic(questionData) {
    const errors = [];

    // Type-specific validation
    switch (questionData.type) {
      case 'multiple_choice':
        if (!questionData.options || !questionData.correct_answer) {
          errors.push('Multiple choice questions require options and correct_answer');
        }
        break;
        
      case 'true_false':
        if (!questionData.correct_answer || !['true', 'false'].includes(questionData.correct_answer.toLowerCase())) {
          errors.push('True/false questions require correct_answer to be "true" or "false"');
        }
        break;
        
      case 'matching':
        if (!questionData.pairs) {
          errors.push('Matching questions require pairs data');
        }
        break;
        
      case 'fill_blank':
      case 'fill_in_the_blank':
        if (!questionData.correct_answer) {
          errors.push('Fill-in-the-blank questions require correct_answer');
        }
        break;
    }

    if (errors.length > 0) {
      throw new ValidationError('Question logic validation failed', errors);
    }

    return true;
  }
}

// Custom validation error class
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

module.exports = { QuestionValidationService, ValidationError };
