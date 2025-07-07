/**
 * Development Testing Utility
 * Provides easy access to mock data for testing universal question system
 */

import { 
  allQuestionTypes, 
  hangmanMockData, 
  towerMockData, 
  ladderMockData,
  getRandomQuestions,
  injectMockData 
} from './mockQuestions';
import { normalizeQuestions } from '../utils/questionNormalizer';

// Development flag to enable mock data (set to true for testing)
export const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

/**
 * Wrap gameData with mock data if in development mode
 * @param {Object} gameData - Original game data from backend
 * @param {string} gameType - Type of game (hangman, tower, ladder, all)
 * @returns {Object} - Game data (original or mock)
 */
export const withMockData = (gameData, gameType = 'all') => {
  // If we have real data, normalize it and use it
  if (gameData && gameData.questions && gameData.questions.length > 0) {
    console.log('📡 Using real game data, normalizing questions...', gameData);
    
    // Normalize backend questions to universal format
    const normalizedQuestions = normalizeQuestions(gameData.questions);
    
    const normalizedGameData = {
      ...gameData,
      questions: normalizedQuestions
    };
    
    console.log('✅ Game data normalized:', normalizedGameData);
    return normalizedGameData;
  }
  
  // Fallback to mock data for development/testing
  const mockData = injectMockData(gameType);
  console.log(`🎭 No backend data available, using mock data for ${gameType}:`, mockData);
  return mockData;
};

/**
 * Force mock data regardless of environment (for testing)
 * @param {string} gameType - Type of game
 * @returns {Object} - Mock game data
 */
export const forceMockData = (gameType = 'all') => {
  const mockData = injectMockData(gameType);
  console.log(`🎭 Forcing mock data for ${gameType}:`, mockData);
  return mockData;
};

/**
 * Get specific question types for testing
 * @param {Array} types - Array of question types ['mcq', 'true_false', etc.]
 * @param {number} count - Number of questions to return
 * @returns {Object} - Game data with specified question types
 */
export const getMockGameData = (types = ['mcq', 'true_false'], count = 5) => {
  const questions = getRandomQuestions(types, count);
  console.log(`🎭 Generated mock data with types [${types.join(', ')}]:`, questions);
  
  return {
    questions,
    metadata: {
      totalQuestions: questions.length,
      questionTypes: types,
      mockData: true
    }
  };
};

/**
 * Get comprehensive test data with one question of each type in order
 * Perfect for testing all question types quickly
 * @returns {Object} - Game data with all question types
 */
export const getComprehensiveTestData = () => {
  const questions = [
    // 1. MCQ Question
    {
      id: "test_mcq",
      type: "mcq",
      question: "What is the capital of France?",
      options: [
        "A) London",
        "B) Paris", 
        "C) Berlin",
        "D) Madrid"
      ],
      correct_answer: "B",
      explanation: "Paris is the capital and largest city of France.",
      category: "Geography",
      difficulty: "easy"
    },
    
    // 2. True/False Question
    {
      id: "test_tf",
      type: "true_false",
      question: "The Earth is flat.",
      correct_answer: false,
      explanation: "The Earth is approximately spherical, not flat.",
      category: "Science",
      difficulty: "easy"
    },
    
    // 3. Fill-in-Blank Question
    {
      id: "test_fill",
      type: "fill_blank",
      question: "The ___BLANK_1___ is the capital of ___BLANK_2___.",
      text: "The ___BLANK_1___ is the capital of ___BLANK_2___.",
      blanks: {
        1: ["Paris"],
        2: ["France"]
      },
      explanation: "Paris is the capital city of France.",
      category: "Geography", 
      difficulty: "easy"
    },
    
    // 4. Matching Question
    {
      id: "test_match",
      type: "matching",
      question: "Match the countries with their capitals:",
      pairs: [
        { left: "Italy", right: "Rome" },
        { left: "Spain", right: "Madrid" },
        { left: "Germany", right: "Berlin" }
      ],
      explanation: "These are the capital cities of major European countries.",
      category: "Geography",
      difficulty: "medium"
    },
    
    // 5. Ordering Question
    {
      id: "test_order",
      type: "ordering",
      question: "Arrange these numbers in ascending order:",
      items: ["use functions", "import classes", "define vars", "use vars"],
      correct_sequence: ["import classes", "define vars", "use vars", "use functions"],
      explanation: "Ascending order means from smallest to largest.",
      category: "Math", 
      difficulty: "easy"
    }
  ];
  
  console.log('🧪 Generated comprehensive test data for testing all question types');
  
  return {
    questions,
    metadata: {
      totalQuestions: questions.length,
      questionTypes: ['mcq', 'true_false', 'fill_blank', 'matching', 'ordering'],
      testMode: true,
      comprehensive: true
    }
  };
};

// Export mock data sets for direct use
export {
  allQuestionTypes,
  hangmanMockData,
  towerMockData, 
  ladderMockData
};
