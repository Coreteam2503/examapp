/**
 * Simple test to isolate the quiz attempt submission issue
 */

console.log('🧪 Testing the frontend quizService.submitQuizAttempt method...\n');

// Simulate the frontend environment
const mockQuizService = {
  async submitQuizAttempt(quizId, answers, timeElapsed, quiz = null, gameData = null) {
    try {
      console.log('📤 Submitting quiz attempt with data:');
      console.log('  quizId:', quizId);
      console.log('  answers:', answers);
      console.log('  timeElapsed:', timeElapsed);
      console.log('  quiz:', quiz ? 'provided' : 'null');
      console.log('  gameData:', gameData);
      
      // Mock the normalization (skip for now)
      let normalizedAnswers = answers;
      
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
      }
      
      console.log('\n📋 Final submission data:');
      console.log(JSON.stringify(submissionData, null, 2));
      
      // This is where the actual API call would happen
      console.log('\n✅ Data preparation successful');
      return { success: true, data: 'mock response' };
      
    } catch (error) {
      console.error('❌ Error in submitQuizAttempt:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit quiz attempt');
    }
  }
};

// Test with sample data similar to what the KnowledgeTowerGame would send
const testData = {
  quizId: 1,
  answers: {
    "12": "sample answer for question 12",
    "8": "RetrievalQA", 
    "10": "B",
    "9": "C",
    "11": "A"
  },
  timeElapsed: 120000, // 2 minutes in milliseconds
  quiz: {
    id: 1,
    title: 'Dynamic Quiz - Computer Science - Artificial Intelligence (Medium)',
    questions: [
      { id: 12, type: 'drag_drop_order' },
      { id: 8, type: 'fill_blank' },
      { id: 10, type: 'multiple_choice' },
      { id: 9, type: 'multiple_choice' },
      { id: 11, type: 'multiple_choice' }
    ]
  },
  gameData: {
    gameFormat: 'knowledge_tower',
    gameResults: {
      totalQuestions: 5,
      correctAnswers: 3,
      score: 60
    },
    score: 60,
    correctAnswers: 3,
    totalQuestions: 5
  }
};

mockQuizService.submitQuizAttempt(
  testData.quizId,
  testData.answers,
  testData.timeElapsed,
  testData.quiz,
  testData.gameData
).then(result => {
  console.log('\n🎯 Test completed successfully:', result);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
});
