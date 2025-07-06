import api, { handleApiError } from './apiService';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// Helper function to retry API calls
const retryApiCall = async (apiCall, retries = RETRY_CONFIG.maxRetries) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0 && RETRY_CONFIG.retryableStatusCodes.includes(error.response?.status)) {
      await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay));
      return retryApiCall(apiCall, retries - 1);
    }
    throw error;
  }
};

// Helper function to validate quiz generation criteria
const validateCriteria = (criteria) => {
  const requiredFields = ['domain', 'subject', 'source', 'game_format', 'difficulty_level', 'num_questions'];
  const missing = requiredFields.filter(field => !criteria[field] || criteria[field] === '');
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (criteria.num_questions < 1 || criteria.num_questions > 50) {
    throw new Error('Number of questions must be between 1 and 50');
  }
  
  const validGameFormats = ['traditional', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid'];
  if (!validGameFormats.includes(criteria.game_format)) {
    throw new Error('Invalid game format');
  }
  
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(criteria.difficulty_level)) {
    throw new Error('Invalid difficulty level');
  }
};

export const quizGenerationService = {
  /**
   * Get available options for quiz generation with caching and retry logic
   * @returns {Promise} API response with generation options
   */
  getGenerationOptions: async () => {
    try {
      const response = await retryApiCall(() => 
        api.get('/quizzes/generation-options')
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Generation options retrieved successfully'
      };
    } catch (error) {
      console.error('Quiz generation options error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Generate dynamic quiz based on criteria with enhanced validation
   * @param {Object} criteria - Quiz generation criteria
   * @returns {Promise} API response with generated quiz
   */
  generateDynamicQuiz: async (criteria) => {
    try {
      // Validate criteria before sending request
      validateCriteria(criteria);
      
      const response = await retryApiCall(() => 
        api.post('/quizzes/generate-dynamic', criteria)
      );
      
      return {
        success: true,
        data: response.data,
        message: `Successfully generated quiz with ${criteria.num_questions} questions`
      };
    } catch (error) {
      console.error('Dynamic quiz generation error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_QUESTIONS',
            message: 'Not enough questions available for the selected criteria',
            details: ['Try adjusting your filters or reducing the number of questions']
          }
        };
      }
      
      if (error.response?.status === 422) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quiz generation criteria validation failed',
            details: error.response.data.errors || error.response.data.error?.details || []
          }
        };
      }
      
      return handleApiError(error);
    }
  },

  /**
   * Get question count for given criteria with enhanced filtering
   * @param {Object} filters - Search filters
   * @returns {Promise} API response with question count
   */
  getAvailableQuestionCount: async (filters) => {
    try {
      // Clean and validate filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );
      
      const searchParams = {
        ...cleanFilters,
        limit: 1,
        offset: 0
      };
      
      const response = await retryApiCall(() => 
        api.get('/questions/search', { params: searchParams })
      );
      
      const count = response.data.data?.pagination?.total || 0;
      
      return {
        success: true,
        count,
        message: `Found ${count} questions matching criteria`
      };
    } catch (error) {
      console.error('Question count check error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get quiz by ID with enhanced error handling
   * @param {number} quizId - Quiz ID
   * @returns {Promise} API response with quiz data
   */
  getQuizById: async (quizId) => {
    try {
      if (!quizId || isNaN(parseInt(quizId))) {
        throw new Error('Valid quiz ID is required');
      }
      
      const response = await retryApiCall(() => 
        api.get(`/quizzes/${parseInt(quizId)}`)
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Quiz retrieved successfully'
      };
    } catch (error) {
      console.error('Get quiz error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Quiz not found',
            details: [`Quiz with ID ${quizId} does not exist`]
          }
        };
      }
      
      return handleApiError(error);
    }
  },

  /**
   * Validate quiz generation criteria locally before API call
   * @param {Object} criteria - Quiz generation criteria
   * @returns {Object} Validation result
   */
  validateGenerationCriteria: (criteria) => {
    const errors = [];
    
    try {
      validateCriteria(criteria);
    } catch (error) {
      errors.push(error.message);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get supported game formats and their configurations
   * @returns {Object} Game formats with their settings
   */
  getGameFormats: () => {
    return {
      traditional: {
        name: 'Traditional Quiz',
        description: 'Standard question and answer format',
        maxQuestions: 50,
        features: ['timer', 'immediate_feedback', 'score_tracking']
      },
      hangman: {
        name: 'Hangman Game',
        description: 'Guess letters to reveal answers',
        maxQuestions: 20,
        features: ['wrong_guess_limit', 'letter_hints', 'visual_hangman']
      },
      knowledge_tower: {
        name: 'Knowledge Tower',
        description: 'Climb the tower by answering correctly',
        maxQuestions: 30,
        features: ['level_progression', 'bonus_points', 'streak_multiplier']
      },
      word_ladder: {
        name: 'Word Ladder',
        description: 'Change one letter at a time to reach the target',
        maxQuestions: 25,
        features: ['step_by_step', 'word_transformation', 'hint_system']
      },
      memory_grid: {
        name: 'Memory Grid',
        description: 'Match questions with their answers',
        maxQuestions: 16,
        features: ['card_matching', 'memory_challenge', 'time_bonus']
      }
    };
  }
};

export default quizGenerationService;
