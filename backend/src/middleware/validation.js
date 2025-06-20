const Joi = require('joi');

// Basic sanitization helper (HTML entity encoding and XSS prevention)
const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    // Basic HTML entity encoding and XSS prevention
    return obj
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
};

// Auth validation schemas
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    }),
    first_name: Joi.string().min(2).max(50).optional().allow(''),
    last_name: Joi.string().min(2).max(50).optional().allow(''),
    role: Joi.string().valid('admin', 'student').default('student')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  // Sanitize input
  req.body = sanitizeInput(value);
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = sanitizeInput(value);
  next();
};

// Quiz validation schemas
const validateQuizGeneration = (req, res, next) => {
  const schema = Joi.object({
    uploadId: Joi.number().integer().positive().required().messages({
      'number.base': 'Upload ID must be a number',
      'number.integer': 'Upload ID must be an integer',
      'number.positive': 'Upload ID must be positive',
      'any.required': 'Upload ID is required'
    }),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    numQuestions: Joi.number().integer().min(1).max(50).default(5),
    questionTypes: Joi.array().items(
      Joi.string().valid('multiple_choice', 'fill_in_the_blank', 'true_false', 'matching')
    ).min(1).default(['multiple_choice']),
    includeHints: Joi.boolean().default(false)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = sanitizeInput(value);
  next();
};

const validateQuizAttempt = (req, res, next) => {
  const schema = Joi.object({
    answers: Joi.object().pattern(
      Joi.number().integer().positive(),
      Joi.object({
        answer: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).required(),
        timeSpent: Joi.number().integer().min(0).optional()
      })
    ).required(),
    timeElapsed: Joi.number().integer().min(0).required(),
    totalQuestions: Joi.number().integer().positive().required(),
    answeredQuestions: Joi.number().integer().min(0).required()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = sanitizeInput(value);
  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  // File validation is handled by multer middleware
  // Additional validation can be added here if needed
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

// User management validation
const validateUserUpdate = (req, res, next) => {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(50).optional().allow(''),
    last_name: Joi.string().min(2).max(50).optional().allow(''),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('admin', 'student').optional()
  }).min(1);

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = sanitizeInput(value);
  next();
};

// Points validation
const validatePointsUpdate = (req, res, next) => {
  const schema = Joi.object({
    points: Joi.number().integer().min(0).required(),
    reason: Joi.string().max(255).optional(),
    type: Joi.string().valid('quiz_completion', 'streak_bonus', 'achievement', 'manual').default('manual')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = sanitizeInput(value);
  next();
};

// Game format validation schemas
const validateGameFormat = (req, res, next) => {
  const schema = Joi.object({
    uploadId: Joi.number().integer().positive().optional().allow(null), // Make uploadId optional
    gameFormat: Joi.string().valid('hangman', 'knowledge_tower', 'word_ladder', 'memory_grid').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    numQuestions: Joi.number().integer().min(1).max(10).default(5), // Add numQuestions support
    gameOptions: Joi.object({
      // Common option for all games
      numQuestions: Joi.number().integer().min(1).max(10).optional(),
      
      // Hangman options
      maxWrongGuesses: Joi.number().integer().min(3).max(10).optional().default(6),
      
      // Knowledge Tower options
      levelsCount: Joi.number().integer().min(1).max(20).optional(),
      
      // Word Ladder options
      maxSteps: Joi.number().integer().min(3).max(15).optional().default(8),
      
      // Memory Grid options
      gridSize: Joi.number().integer().min(3).max(6).optional().default(4),
      memoryTime: Joi.number().integer().min(2).max(10).optional().default(5)
    }).optional().default({})
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    console.log('Game format validation error:', error.details);
    return res.status(400).json({
      success: false,
      message: 'Game validation error',
      errors: error.details.map(detail => detail.message),
      receivedData: req.body // Help with debugging
    });
  }

  // Sanitize and enhance the data
  req.body = sanitizeInput(value);
  
  // Ensure numQuestions is set from either direct field or gameOptions
  if (!req.body.numQuestions && req.body.gameOptions && req.body.gameOptions.numQuestions) {
    req.body.numQuestions = req.body.gameOptions.numQuestions;
  }
  
  console.log('Game format validation passed:', req.body);
  next();
};

// ID parameter validation
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const schema = Joi.number().integer().positive().required();
    
    const { error } = schema.validate(id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
        errors: [`${paramName} must be a positive integer`]
      });
    }
    
    next();
  };
};

// Query parameter validation
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().max(50).default('created_at')
  });

  const { error, value } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.query = sanitizeInput(value);
  next();
};

// Generic body sanitization middleware
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateQuizGeneration,
  validateQuizAttempt,
  validateFileUpload,
  validateUserUpdate,
  validatePointsUpdate,
  validateGameFormat,
  validateId,
  validatePagination,
  sanitizeBody,
  sanitizeInput
};
