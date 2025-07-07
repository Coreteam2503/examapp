import axios from 'axios';
import { normalizeQuizAnswers } from '../utils/answerNormalization';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Fixed: use same key as apiService
    console.log('QuizService - Token found:', token ? 'Yes' : 'No');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('QuizService - Authorization header set');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken'); // Fixed: use same key as apiService
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const quizService = {
  /**
   * Generate a quiz from uploaded content
   */
  generateQuiz: async (uploadId, options = {}) => {
    try {
      const response = await apiClient.post('/quizzes/generate', {
        uploadId,
        difficulty: options.difficulty || 'medium',
        numQuestions: options.numQuestions || 5,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate quiz');
    }
  },

  /**
   * Get all quizzes for the current user
   */
  getUserQuizzes: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/quizzes', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch quizzes');
    }
  },

  /**
   * Get a specific quiz by ID
   */
  getQuizById: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch quiz');
    }
  },

  /**
   * Delete a quiz
   */
  deleteQuiz: async (quizId) => {
    try {
      const response = await apiClient.delete(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete quiz');
    }
  },

  /**
   * Submit quiz attempt and get results
   */
  submitQuizAttempt: async (quizId, answers, timeElapsed, quiz = null, gameData = null) => {
    try {
      // DEBUG: Log all input parameters
      console.log('🔍 DEBUG - submitQuizAttempt called with:', {
        quizId,
        answers,
        timeElapsed,
        quiz: quiz ? { id: quiz.id, title: quiz.title, questionsCount: quiz.questions?.length } : null,
        gameData
      });

      // Normalize answers before submission if quiz data is available
      let normalizedAnswers = answers;
      if (quiz && quiz.questions) {
        normalizedAnswers = normalizeQuizAnswers(answers, quiz.questions);
        console.log('Original answers:', answers);
        console.log('Normalized answers:', normalizedAnswers);
      }
      
      const submissionData = {
        quizId,
        answers: normalizedAnswers,
        timeElapsed,
        completedAt: new Date().toISOString()
      };
      
      // Add game-specific data if this is a game format
      if (gameData) {
        submissionData.gameFormat = gameData.gameFormat;
        submissionData.gameResults = gameData.gameResults;
        submissionData.isGameFormat = true;
        
        // For game formats, use the pre-calculated score
        if (gameData.score !== undefined) {
          submissionData.score = gameData.score;
          submissionData.correctAnswers = gameData.correctAnswers;
          submissionData.totalQuestions = gameData.totalQuestions;
        }
        
        console.log('Submitting game format quiz attempt:', submissionData);
      }
      
      // DEBUG: Log final submission data before API call
      console.log('🔍 DEBUG - Final submissionData before API call:', submissionData);
      console.log('🔍 DEBUG - About to make POST request to /quiz-attempts');
      
      const response = await apiClient.post('/quiz-attempts', submissionData);
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit quiz attempt');
    }
  },

  /**
   * Get quiz attempt results
   */
  getQuizResults: async (attemptId) => {
    try {
      const response = await apiClient.get(`/quiz-attempts/${attemptId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch quiz results');
    }
  },

  /**
   * Get detailed quiz results
   */
  getDetailedResults: async (attemptId) => {
    try {
      const response = await apiClient.get(`/quiz-attempts/${attemptId}/detailed`);
      return response.data;
    } catch (error) {
      console.error('Error fetching detailed results:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch detailed results');
    }
  },

  /**
   * Get user's quiz history and performance
   */
  getQuizHistory: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/quiz-attempts', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch quiz history');
    }
  },

  /**
   * Get user statistics and analytics
   */
  getUserStatistics: async () => {
    try {
      const response = await apiClient.get('/quiz-attempts/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch user statistics');
    }
  },

  /**
   * Get recent quiz attempts for dashboard
   */
  getRecentQuizAttempts: async (limit = 5) => {
    try {
      const response = await apiClient.get('/quiz-attempts/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent quiz attempts:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch recent quiz attempts');
    }
  },

  /**
   * Delete a quiz attempt
   */
  deleteQuizAttempt: async (attemptId) => {
    try {
      const response = await apiClient.delete(`/quiz-attempts/${attemptId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quiz attempt:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete quiz attempt');
    }
  }
};

export default quizService;
