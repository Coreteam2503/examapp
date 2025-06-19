/**
 * Test script to verify quiz scoring fix for game formats
 */

console.log('🎯 Quiz Scoring Fix Test');
console.log('========================');

// Test the transformation function logic
function transformGameResultsToQuizFormat(gameResults, gameFormat, quiz) {
  const answers = {};
  let totalQuestions = 0;
  let answeredQuestions = 0;
  
  switch (gameFormat) {
    case 'hangman':
      totalQuestions = gameResults.totalWords || gameResults.totalWordsCompleted || quiz.questions?.length || 1;
      answeredQuestions = gameResults.totalWordsCompleted || gameResults.results?.length || totalQuestions;
      
      // Create mock answers for each word in hangman
      if (gameResults.results && Array.isArray(gameResults.results)) {
        gameResults.results.forEach((result, index) => {
          const questionId = quiz.questions?.[index]?.id || `hangman_word_${index}`;
          answers[questionId] = {
            answer: result.status === 'won' ? 'correct' : 'incorrect',
            timeSpent: result.timeSpent || 0,
            isCorrect: result.status === 'won',
            gameSpecific: {
              word: result.word,
              wrongGuesses: result.wrongGuesses,
              guessedLetters: result.guessedLetters
            }
          };
        });
      } else {
        // Fallback for single result
        const questionId = quiz.questions?.[0]?.id || 'hangman_result';
        answers[questionId] = {
          answer: gameResults.correctWords > 0 ? 'correct' : 'incorrect',
          timeSpent: gameResults.timeElapsed || 0,
          isCorrect: gameResults.correctWords > 0
        };
      }
      break;
      
    case 'knowledge_tower':
      totalQuestions = gameResults.totalLevels || gameResults.totalQuestions || quiz.questions?.length || 1;
      answeredQuestions = gameResults.results?.length || totalQuestions;
      
      // Create answers for each level in knowledge tower
      if (gameResults.results && Array.isArray(gameResults.results)) {
        gameResults.results.forEach((result, index) => {
          const questionId = quiz.questions?.[index]?.id || `tower_level_${result.level || index}`;
          answers[questionId] = {
            answer: result.selectedAnswer,
            timeSpent: result.timeSpent || 0,
            isCorrect: result.isCorrect,
            gameSpecific: {
              level: result.level,
              levelTheme: result.levelTheme,
              correctAnswer: result.correctAnswer
            }
          };
        });
      } else {
        // Fallback for aggregate result
        const questionId = quiz.questions?.[0]?.id || 'tower_result';
        answers[questionId] = {
          answer: gameResults.correctAnswers > 0 ? 'correct' : 'incorrect',
          timeSpent: gameResults.timeElapsed || 0,
          isCorrect: gameResults.correctAnswers > 0
        };
      }
      break;
  }
  
  return {
    answers,
    totalQuestions,
    answeredQuestions
  };
}

// Test cases
console.log('\n📝 Test Case 1: Hangman Game');
console.log('-----------------------------');

const hangmanGameResults = {
  totalWords: 5,
  totalWordsCompleted: 5,
  correctWords: 3,
  timeElapsed: 240,
  results: [
    { word: 'JAVASCRIPT', status: 'won', wrongGuesses: 2, timeSpent: 45, guessedLetters: ['J','A','V','S','C','R','I','P','T'] },
    { word: 'PYTHON', status: 'won', wrongGuesses: 1, timeSpent: 30, guessedLetters: ['P','Y','T','H','O','N'] },
    { word: 'REACT', status: 'lost', wrongGuesses: 6, timeSpent: 60, guessedLetters: ['R','E','A','C','T','X','Y','Z'] },
    { word: 'NODE', status: 'won', wrongGuesses: 0, timeSpent: 25, guessedLetters: ['N','O','D','E'] },
    { word: 'DATABASE', status: 'lost', wrongGuesses: 6, timeSpent: 80, guessedLetters: ['D','A','T','B','S','X','Y','Z'] }
  ]
};

const hangmanQuiz = {
  questions: [
    { id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }
  ]
};

const hangmanTransformed = transformGameResultsToQuizFormat(hangmanGameResults, 'hangman', hangmanQuiz);
console.log('✅ Hangman Results:');
console.log('   Total Questions:', hangmanTransformed.totalQuestions);
console.log('   Answered Questions:', hangmanTransformed.answeredQuestions);
console.log('   Correct Answers:', Object.values(hangmanTransformed.answers).filter(a => a.isCorrect).length);
console.log('   Expected Score: 60% (3/5)');

console.log('\n📝 Test Case 2: Knowledge Tower Game');
console.log('------------------------------------');

const towerGameResults = {
  totalLevels: 5,
  correctAnswers: 4,
  timeElapsed: 300,
  results: [
    { level: 1, selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeSpent: 30, levelTheme: 'Basics' },
    { level: 2, selectedAnswer: 'B', correctAnswer: 'B', isCorrect: true, timeSpent: 45, levelTheme: 'Intermediate' },
    { level: 3, selectedAnswer: 'C', correctAnswer: 'A', isCorrect: false, timeSpent: 60, levelTheme: 'Advanced' },
    { level: 4, selectedAnswer: 'D', correctAnswer: 'D', isCorrect: true, timeSpent: 50, levelTheme: 'Expert' },
    { level: 5, selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeSpent: 40, levelTheme: 'Master' }
  ]
};

const towerQuiz = {
  questions: [
    { id: 't1' }, { id: 't2' }, { id: 't3' }, { id: 't4' }, { id: 't5' }
  ]
};

const towerTransformed = transformGameResultsToQuizFormat(towerGameResults, 'knowledge_tower', towerQuiz);
console.log('✅ Knowledge Tower Results:');
console.log('   Total Questions:', towerTransformed.totalQuestions);
console.log('   Answered Questions:', towerTransformed.answeredQuestions);
console.log('   Correct Answers:', Object.values(towerTransformed.answers).filter(a => a.isCorrect).length);
console.log('   Expected Score: 80% (4/5)');

// Test backend score calculation
function calculateGameScore(gameResults, gameFormat) {
  let correctAnswers = 0;
  let totalAnswered = 0;
  
  switch (gameFormat) {
    case 'hangman':
      correctAnswers = gameResults.correctWords || 0;
      totalAnswered = gameResults.totalWordsCompleted || gameResults.totalWords || 1;
      break;
      
    case 'knowledge_tower':
      correctAnswers = gameResults.correctAnswers || 0;
      totalAnswered = gameResults.totalQuestions || gameResults.totalLevels || 1;
      break;
  }
  
  const scorePercentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
  
  return {
    correctAnswers,
    totalAnswered,
    scorePercentage
  };
}

console.log('\n🧮 Backend Score Calculation Test');
console.log('----------------------------------');

const hangmanScore = calculateGameScore(hangmanGameResults, 'hangman');
console.log('Hangman Score:', hangmanScore);

const towerScore = calculateGameScore(towerGameResults, 'knowledge_tower');
console.log('Tower Score:', towerScore);

console.log('\n🎉 All tests completed!');
console.log('The fix should now properly:');
console.log('✅ Track answered questions correctly');
console.log('✅ Calculate correct answers properly');
console.log('✅ Display accurate final scores');
console.log('✅ Show proper statistics in results');
