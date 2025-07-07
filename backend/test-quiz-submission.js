/**
 * Test quiz attempt submission to debug the issue
 */

const axios = require('axios');

async function testQuizSubmission() {
  console.log('🧪 Testing Quiz Attempt Submission...\n');
  
  try {
    // First, test if we can access the quiz attempts endpoint
    const testData = {
      quizId: 1,
      answers: {
        "1": "test answer"
      },
      timeElapsed: 120,
      completedAt: new Date().toISOString(),
      isGameFormat: true,
      gameFormat: 'knowledge_tower',
      gameResults: {
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100
      }
    };
    
    console.log('Test submission data:', testData);
    
    // Try without authentication first to see the specific error
    try {
      const response = await axios.post('http://localhost:8000/api/quiz-attempts', testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected auth error:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        console.log('✅ Auth error as expected - endpoint is reachable');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testQuizSubmission()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
