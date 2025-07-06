import { useState, useCallback, useRef } from 'react';
import { handleApiError } from '../services/apiService';

/**
 * Custom hook for API service integration with loading states and error handling
 * @param {Object} options - Configuration options
 * @returns {Object} API service utilities
 */
export const useApiService = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    onSuccess = () => {},
    onError = () => {},
    showSuccessMessage = false,
    showErrorMessage = true,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  /**
   * Execute API call with loading state management and error handling
   * @param {Function} apiCall - Function that returns a Promise
   * @param {Object} options - Call-specific options
   * @returns {Promise} API response
   */
  const executeApiCall = useCallback(async (apiCall, callOptions = {}) => {
    const {
      onCallSuccess = onSuccess,
      onCallError = onError,
      showCallSuccessMessage = showSuccessMessage,
      showCallErrorMessage = showErrorMessage,
      retries = retryCount
    } = callOptions;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiCall(abortControllerRef.current.signal);
        
        setLoading(false);
        
        if (result.success) {
          if (showCallSuccessMessage && result.message) {
            // You can integrate with a toast notification system here
            console.log('Success:', result.message);
          }
          onCallSuccess(result);
        } else {
          setError(result.error);
          if (showCallErrorMessage) {
            console.error('API Error:', result.error.message);
          }
          onCallError(result.error);
        }
        
        return result;
      } catch (err) {
        lastError = err;
        
        // Don't retry if request was aborted
        if (err.name === 'AbortError') {
          setLoading(false);
          return { success: false, error: { code: 'ABORTED', message: 'Request cancelled' } };
        }
        
        // Retry for retryable errors
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        const shouldRetry = attempt < retries && 
          (err.response?.status && retryableStatusCodes.includes(err.response.status));
        
        if (shouldRetry) {
          console.log(`Retrying API call (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }
        
        break;
      }
    }

    // All retries failed
    setLoading(false);
    const errorResult = handleApiError(lastError);
    setError(errorResult.error);
    
    if (showCallErrorMessage) {
      console.error('API Error:', errorResult.error.message);
    }
    
    onCallError(errorResult.error);
    return errorResult;
  }, [onSuccess, onError, showSuccessMessage, showErrorMessage, retryCount, retryDelay]);
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    loading,
    error,
    executeApiCall,
    clearError,
    cancelRequest,
    reset
  };
};

/**
 * Specialized hook for question bank operations
 */
export const useQuestionService = (options = {}) => {
  const apiService = useApiService(options);
  
  const bulkCreateQuestions = useCallback((questions) => {
    return apiService.executeApiCall(async (signal) => {
      const { questionService } = await import('../services/questionService');
      return await questionService.bulkCreate(questions);
    });
  }, [apiService]);

  const searchQuestions = useCallback((filters, searchOptions) => {
    return apiService.executeApiCall(async (signal) => {
      const { questionService } = await import('../services/questionService');
      return await questionService.search(filters, searchOptions);
    });
  }, [apiService]);

  const getStatistics = useCallback(() => {
    return apiService.executeApiCall(async (signal) => {
      const { questionService } = await import('../services/questionService');
      return await questionService.getStatistics();
    });
  }, [apiService]);

  return {
    ...apiService,
    bulkCreateQuestions,
    searchQuestions,
    getStatistics
  };
};

/**
 * Specialized hook for quiz generation operations
 */
export const useQuizGenerationService = (options = {}) => {
  const apiService = useApiService(options);
  
  const getGenerationOptions = useCallback(() => {
    return apiService.executeApiCall(async (signal) => {
      const { quizGenerationService } = await import('../services/quizGenerationService');
      return await quizGenerationService.getGenerationOptions();
    });
  }, [apiService]);

  const generateDynamicQuiz = useCallback((criteria) => {
    return apiService.executeApiCall(async (signal) => {
      const { quizGenerationService } = await import('../services/quizGenerationService');
      return await quizGenerationService.generateDynamicQuiz(criteria);
    });
  }, [apiService]);

  const getAvailableQuestionCount = useCallback((filters) => {
    return apiService.executeApiCall(async (signal) => {
      const { quizGenerationService } = await import('../services/quizGenerationService');
      return await quizGenerationService.getAvailableQuestionCount(filters);
    });
  }, [apiService]);

  return {
    ...apiService,
    getGenerationOptions,
    generateDynamicQuiz,
    getAvailableQuestionCount
  };
};

export default useApiService;
