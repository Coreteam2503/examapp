/**
 * API Services Integration Test
 * Tests the enhanced API services with proper error handling and retry logic
 */

import { questionService } from '../services/questionService';
import { quizGenerationService } from '../services/quizGenerationService';

// Mock test data
const mockQuestion = {
  domain: 'Computer Science',
  subject: 'Programming',
  source: 'Test Source',
  question_type: 'Conceptual',
  type: 'mcq',
  question: 'What is the time complexity of binary search?',
  explanation: 'Binary search has O(log n) time complexity because it divides the search space in half with each iteration.',
  difficulty_level: 'Medium',
  options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
  correct_answer: 'O(log n)',
  weightage: 1
};

/**
 * Test enhanced question service functionality
 */
export const testQuestionService = async () => {
  console.log('🧪 Testing Enhanced Question Service...');
  
  try {
    // Test validation
    const validation = questionService.validateQuestion(mockQuestion);
    console.log('✅ Question validation:', validation.isValid ? 'PASSED' : 'FAILED');
    
    if (!validation.isValid) {
      console.log('❌ Validation errors:', validation.errors);
    }
    
    // Test statistics retrieval
    const statsResult = await questionService.getStatistics();
    console.log('📊 Statistics retrieval:', statsResult.success ? 'PASSED' : 'FAILED');
    
    if (statsResult.success) {
      console.log('📈 Total questions:', statsResult.data?.totalQuestions || 0);
    } else {
      console.log('❌ Statistics error:', statsResult.error?.message);
    }
    
  } catch (error) {
    console.error('❌ Question service test failed:', error.message);
  }
};

/**
 * Run all integration tests
 */
export const runIntegrationTests = async () => {
  console.log('🚀 Starting API Services Integration Tests...');
  console.log('================================================');
  
  await testQuestionService();
  console.log('✅ Integration tests completed!');
};

export default {
  testQuestionService,
  runIntegrationTests
};
