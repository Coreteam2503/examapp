// Load environment variables first
require('dotenv').config();

const aiService = require('../services/aiService');

// Test script to verify AI integration
const testAIIntegration = async () => {
  console.log('🤖 Testing AI Integration...\n');

  // Test 1: Check service status
  console.log('1. Checking AI service status...');
  const status = aiService.getStatus();
  console.log('Status:', status);
  console.log('✅ Service status check completed\n');

  // Test 2: Test API connection
  if (status.configured) {
    console.log('2. Testing API connection...');
    try {
      const connectionTest = await aiService.testConnection();
      console.log('Connection test result:', connectionTest);
      
      if (connectionTest.success) {
        console.log('✅ API connection successful');
        console.log('Model:', connectionTest.model);
        console.log('Response:', connectionTest.response);
      } else {
        console.log('❌ API connection failed');
        console.log('Error:', connectionTest.error);
      }
    } catch (error) {
      console.log('❌ Connection test error:', error.message);
    }
    console.log('');

    // Test 3: Test quiz generation
    console.log('3. Testing quiz generation...');
    const sampleCode = `
function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`;

    try {
      const quizResult = await aiService.generateQuizQuestions(sampleCode, {
        numQuestions: 3,
        difficulty: 'medium',
        questionTypes: ['multiple-choice'],
        language: 'javascript'
      });

      if (quizResult.success) {
        console.log('✅ Quiz generation successful');
        console.log('Generated questions:', quizResult.questions.length);
        console.log('Sample question:', quizResult.questions[0].question);
      } else {
        console.log('❌ Quiz generation failed');
      }
    } catch (error) {
      console.log('❌ Quiz generation error:', error.message);
    }
    console.log('');

    // Test 4: Test code explanation
    console.log('4. Testing code explanation...');
    try {
      const explanationResult = await aiService.explainCode(sampleCode, 'javascript');
      
      if (explanationResult.success) {
        console.log('✅ Code explanation successful');
        console.log('Explanation preview:', explanationResult.explanation.substring(0, 200) + '...');
      } else {
        console.log('❌ Code explanation failed');
      }
    } catch (error) {
      console.log('❌ Code explanation error:', error.message);
    }
  } else {
    console.log('2-4. Skipping API tests (service not configured)');
  }

  console.log('\n🎉 AI Integration test completed!');
};

// Run test if called directly
if (require.main === module) {
  require('dotenv').config();
  testAIIntegration().catch(console.error);
}

module.exports = testAIIntegration;
