/**
 * Enhanced error handling for quiz submission
 * Add this temporary debugging to your QuizManager.js to get more details
 */

// Enhanced handleQuizComplete function with detailed error logging
const handleQuizCompleteWithDebugging = async () => {
  try {
    console.log('🔍 Starting quiz submission...');
    console.log('Selected quiz:', selectedQuiz);
    console.log('Quiz results:', results);
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    console.log('Auth token exists:', token ? 'Yes' : 'No');
    console.log('Auth token preview:', token ? token.substring(0, 20) + '...' : 'None');
    
    // Prepare submission data
    const submissionData = {
      quizId: selectedQuiz.id,
      answers: results.answers,
      timeElapsed: results.timeElapsed,
      quiz: selectedQuiz,
      gameData: {
        gameFormat: results.gameFormat,
        gameResults: results.gameResults,
        score: gameScore,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions
      }
    };
    
    console.log('🚀 Submitting with data:', submissionData);
    
    const response = await quizService.submitQuizAttempt(
      selectedQuiz.id,
      results.answers,
      results.timeElapsed,
      selectedQuiz,
      {
        gameFormat: results.gameFormat,
        gameResults: results.gameResults,
        score: gameScore,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions
      }
    );
    
    console.log('✅ Submission successful:', response);
    
  } catch (error) {
    console.error('💥 Detailed submission error:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('Request:', error.request);
    }
    
    // Show user-friendly error
    alert(`Quiz submission failed: ${error.message}\\n\\nCheck console for details.`);
    throw error;
  }
};

console.log('📋 DEBUGGING INSTRUCTIONS:');
console.log('1. Replace your handleQuizComplete function with the enhanced version above');
console.log('2. Try submitting a quiz');
console.log('3. Check the browser console for detailed error information');
console.log('4. Look for authentication, response, or request issues');
