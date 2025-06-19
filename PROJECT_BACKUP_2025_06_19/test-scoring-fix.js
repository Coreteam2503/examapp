// 🧪 Test Quiz Scoring Fix for Games

console.log('🎯 Testing Quiz Scoring Fix...\n');

// Test game score calculation function
function calculateGameScore(gameResults, gameFormat, totalQuestions) {
  let correctAnswers = 0;
  let totalAnswered = 0;
  
  console.log('📊 Input:', { gameResults, gameFormat, totalQuestions });
  
  switch (gameFormat) {
    case 'hangman':
      correctAnswers = gameResults.correctWords || 0;
      totalAnswered = gameResults.totalWordsCompleted || gameResults.totalWords || totalQuestions;
      break;
      
    case 'knowledge_tower':
      correctAnswers = gameResults.correctAnswers || 0;
      totalAnswered = gameResults.totalQuestions || gameResults.totalLevels || totalQuestions;
      break;
      
    default:
      correctAnswers = gameResults.score ? Math.round((gameResults.score / 100) * totalQuestions) : totalQuestions;
      totalAnswered = totalQuestions;
      break;
  }
  
  const scorePercentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  
  return {
    correctAnswers,
    totalAnswered,
    scorePercentage,
    totalQuestions
  };
}

// Test Case 1: Hangman 100% score (from your screenshot)
console.log('🎮 Test 1: Hangman Game (100% score)');
const hangmanResult = {
  correctWords: 5,
  totalWordsCompleted: 5,
  totalWords: 5,
  timeElapsed: 20
};

const hangmanScore = calculateGameScore(hangmanResult, 'hangman', 5);
console.log('✅ Result:', hangmanScore);
console.log('Expected: 100%, 5/5 words');
console.log('Match:', hangmanScore.scorePercentage === 100 && hangmanScore.correctAnswers === 5);

console.log('\n📋 Database attempt record would be:');
console.log({
  total_questions: hangmanScore.totalQuestions,
  questions_answered: hangmanScore.totalAnswered,
  correct_answers: hangmanScore.correctAnswers,
  score_percentage: hangmanScore.scorePercentage
});

console.log('\n🎯 Frontend QuizResults display would show:');
console.log(`Score: ${hangmanScore.scorePercentage}%`);
console.log(`Correct: ${hangmanScore.correctAnswers}`);
console.log(`Answered: ${hangmanScore.totalAnswered}/${hangmanScore.totalQuestions}`);

console.log('\n🔍 This should fix the issue where:');
console.log('❌ Before: 0% score, 0/5 correct');
console.log('✅ After: 100% score, 5/5 correct');
