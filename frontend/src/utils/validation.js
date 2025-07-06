      page: Math.max(1, parseInt(params.page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(params.limit) || 20))
    };
  },

  /**
   * Sanitize search filters by removing empty values
   * @param {Object} filters - Search filters
   * @returns {Object} Clean filters
   */
  sanitizeFilters: (filters = {}) => {
    return Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    );
  },

  /**
   * Validate ID parameter
   * @param {any} id - ID to validate
   * @returns {Object} Validation result
   */
  validateId: (id) => {
    const numericId = parseInt(id);
    return {
      isValid: !isNaN(numericId) && numericId > 0,
      id: numericId,
      error: isNaN(numericId) || numericId <= 0 ? 'Invalid ID format' : null
    };
  },

  /**
   * Format API error for display
   * @param {Object} error - Error object from API response
   * @returns {String} Formatted error message
   */
  formatErrorMessage: (error) => {
    if (!error) return 'An unknown error occurred';
    
    if (error.details && Array.isArray(error.details) && error.details.length > 0) {
      return `${error.message}: ${error.details.join(', ')}`;
    }
    
    return error.message || 'An unknown error occurred';
  },

  /**
   * Extract field-specific errors for form validation
   * @param {Object} error - Error object from API response
   * @returns {Object} Field errors mapping
   */
  extractFieldErrors: (error) => {
    const fieldErrors = {};
    
    if (error.details && Array.isArray(error.details)) {
      error.details.forEach(detail => {
        if (typeof detail === 'object' && detail.field && detail.message) {
          fieldErrors[detail.field] = detail.message;
        }
      });
    }
    
    return fieldErrors;
  }
};

// Response validation helpers
export const responseValidation = {
  /**
   * Validate API response structure
   * @param {Object} response - API response
   * @returns {Boolean} Is valid response
   */
  isValidResponse: (response) => {
    return response && typeof response === 'object' && typeof response.success === 'boolean';
  },

  /**
   * Extract data from successful response
   * @param {Object} response - API response
   * @returns {any} Response data
   */
  extractData: (response) => {
    if (!responseValidation.isValidResponse(response)) {
      throw new Error('Invalid response format');
    }
    
    if (!response.success) {
      throw new Error(response.error?.message || 'API request failed');
    }
    
    return response.data;
  },

  /**
   * Extract error from failed response
   * @param {Object} response - API response
   * @returns {Object} Error details
   */
  extractError: (response) => {
    if (!responseValidation.isValidResponse(response)) {
      return { code: 'INVALID_RESPONSE', message: 'Invalid response format' };
    }
    
    return response.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
  }
};

// Export all validation utilities
export default {
  questionValidation,
  quizValidation,
  apiValidation,
  responseValidation
};
