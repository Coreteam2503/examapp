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

// Helper function to validate question data
const validateQuestionData = (questions) => {
  if (!Array.isArray(questions)) {
    throw new Error('Questions must be an array');
  }
  
  if (questions.length === 0) {
    throw new Error('At least one question is required');
  }
  
  // Basic validation for required fields (aligned with backend schema)
  questions.forEach((question, index) => {
    const requiredFields = ['domain', 'subject', 'source', 'type', 'question_text', 'explanation', 'difficulty_level'];
    requiredFields.forEach(field => {
      if (!question[field]) {
        throw new Error(`Question ${index + 1}: ${field} is required`);
      }
    });
  });
};

export const questionService = {
  /**
   * Create multiple questions in bulk with enhanced validation and retry logic
   * @param {Array} questions - Array of question objects
   * @returns {Promise} API response
   */
  bulkCreate: async (questions) => {
    try {
      // Validate input data
      validateQuestionData(questions);
      
      const response = await retryApiCall(() => 
        api.post('/questions/bulk', { questions })
      );
      
      return {
        success: true,
        data: response.data,
        message: `Successfully processed ${questions.length} questions`
      };
    } catch (error) {
      console.error('Question bulk create error:', error);
      
      // Enhanced error handling for validation errors
      if (error.response?.status === 422) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Question validation failed',
            details: error.response.data.errors || error.response.data.error?.details || []
          }
        };
      }
      
      return handleApiError(error);
    }
  },

  /**
   * Search questions with filters and pagination with enhanced error handling
   * @param {Object} filters - Search filters (domain, subject, source, difficulty_level, type)
   * @param {Object} options - Pagination and sorting options (page, limit)
   * @returns {Promise} API response
   */
  search: async (filters = {}, options = {}) => {
    try {
      // Sanitize and validate parameters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );
      
      const searchOptions = {
        page: Math.max(1, parseInt(options.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(options.limit) || 20)),
        ...cleanFilters
      };
      
      const response = await retryApiCall(() => 
        api.get('/questions/search', { params: searchOptions })
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Questions retrieved successfully'
      };
    } catch (error) {
      console.error('Question search error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get question bank statistics with caching support
   * @returns {Promise} API response
   */
  getStatistics: async () => {
    try {
      const response = await retryApiCall(() => 
        api.get('/questions/statistics')
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Question statistics error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Get question by ID with enhanced validation
   * @param {number} id - Question ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Valid question ID is required');
      }
      
      const response = await retryApiCall(() => 
        api.get(`/questions/${parseInt(id)}`)
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Question retrieved successfully'
      };
    } catch (error) {
      console.error('Question get by ID error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Question not found',
            details: [`Question with ID ${id} does not exist`]
          }
        };
      }
      
      return handleApiError(error);
    }
  },

  /**
   * Update question by ID with validation
   * @param {number} id - Question ID
   * @param {Object} questionData - Updated question data
   * @returns {Promise} API response
   */
  updateById: async (id, questionData) => {
    try {
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Valid question ID is required');
      }
      
      if (!questionData || typeof questionData !== 'object') {
        throw new Error('Valid question data is required');
      }
      
      const response = await retryApiCall(() => 
        api.put(`/questions/${parseInt(id)}`, questionData)
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Question updated successfully'
      };
    } catch (error) {
      console.error('Question update error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Question not found',
            details: [`Question with ID ${id} does not exist`]
          }
        };
      }
      
      if (error.response?.status === 422) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Question validation failed',
            details: error.response.data.errors || error.response.data.error?.details || []
          }
        };
      }
      
      return handleApiError(error);
    }
  },

  /**
   * Get available question metadata options for filters
   * @returns {Promise} API response with domains, subjects, sources, etc.
   */
  getMetadataOptions: async () => {
    try {
      const response = await retryApiCall(() => 
        api.get('/questions/metadata-options')
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Metadata options retrieved successfully'
      };
    } catch (error) {
      console.error('Question metadata options error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Validate question format before submission
   * @param {Object} question - Question object to validate
   * @returns {Object} Validation result
   */
  validateQuestion: (question) => {
    const errors = [];
    
    // Required fields validation (aligned with backend schema)
    const requiredFields = {
      domain: 'Domain',
      subject: 'Subject', 
      source: 'Source',
      type: 'Type',
      question_text: 'Question Text',
      explanation: 'Explanation',
      difficulty_level: 'Difficulty Level'
    };
    
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!question[field] || question[field].toString().trim() === '') {
        errors.push(`${label} is required`);
      }
    });
    
    // Type-specific validation
    if (question.type === 'multiple_choice' && (!question.options || question.options.toString().trim() === '')) {
      errors.push('Multiple choice questions must have options');
    }
    
    if (question.type === 'true_false' && (!question.correct_answer || !['true', 'false'].includes(question.correct_answer.toLowerCase()))) {
      errors.push('True/false questions require correct_answer to be "true" or "false"');
    }
    
    if (question.type === 'matching' && (!question.pairs || question.pairs.toString().trim() === '')) {
      errors.push('Matching questions require pairs data');
    }
    
    if ((question.type === 'fill_blank' || question.type === 'fill_in_the_blank') && (!question.correct_answer || question.correct_answer.toString().trim() === '')) {
      errors.push('Fill-in-the-blank questions require correct_answer');
    }
    
    // Difficulty level validation
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (question.difficulty_level && !validDifficulties.includes(question.difficulty_level)) {
      errors.push('Difficulty level must be Easy, Medium, or Hard');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default questionService;
