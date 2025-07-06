/**
 * Test data fixtures for different game scenarios
 */

const hangmanTestData = {
  // Correct answers for typical hangman questions
  correctAnswers: [
    { type: 'mcq', option: 'A', isCorrect: true },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: true },
    { type: 'fill_blank', text: 'function', isCorrect: true },
    { type: 'mcq', option: 'C', isCorrect: true }
  ],
  
  // Mix of correct and incorrect answers
  mixedAnswers: [
    { type: 'mcq', option: 'A', isCorrect: true },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: false },
    { type: 'mcq', option: 'A', isCorrect: true }
  ],

  // All wrong answers (for hangman failure test)
  wrongAnswers: [
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'mcq', option: 'D', isCorrect: false }
  ]
};

const ladderTestData = {
  // Correct answers for ladder climbing
  correctAnswers: [
    { type: 'mcq', option: 'A', isCorrect: true },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: true },
    { type: 'mcq', option: 'C', isCorrect: true },
    { type: 'true_false', value: false, isCorrect: true }
  ],

  // Mix of answers for partial ladder progress
  mixedAnswers: [
    { type: 'mcq', option: 'A', isCorrect: true },
    { type: 'mcq', option: 'D', isCorrect: false },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'C', isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: false }
  ]
};

const towerTestData = {
  // Progressive tower climbing
  correctAnswers: [
    { type: 'mcq', option: 'A', isCorrect: true },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: true },
    { type: 'fill_blank', text: 'variable', isCorrect: true },
    { type: 'mcq', option: 'C', isCorrect: true }
  ],

  // Tower with retry scenarios
  retryScenarios: [
    { type: 'mcq', option: 'D', isCorrect: false, retry: { type: 'mcq', option: 'A', isCorrect: true } },
    { type: 'true_false', value: true, isCorrect: true },
    { type: 'mcq', option: 'B', isCorrect: true }
  ]
};

const questionTypeTests = {
  mcq: {
    correctOptions: ['A', 'B', 'C'],
    incorrectOption: 'D'
  },
  
  trueFalse: {
    trueAnswers: [true],
    falseAnswers: [false]
  },
  
  fillBlank: {
    commonAnswers: ['function', 'variable', 'array', 'object', 'string'],
    wrongAnswers: ['wronganswer', 'incorrect', 'xyz']
  },
  
  matching: {
    // Will be dynamically handled based on question content
  },
  
  ordering: {
    // Will be dynamically handled based on question content
  }
};

module.exports = {
  hangmanTestData,
  ladderTestData,
  towerTestData,
  questionTypeTests
};
