/**
 * Mock Questions for Universal Question System Testing
 * Contains examples of all supported question types for testing games
 */

export const mockQuestions = {
  // Multiple Choice Questions
  mcq: [
    {
      id: "mcq_1",
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
    {
      id: "mcq_2", 
      type: "mcq",
      question: "Which programming language is known for 'write once, run anywhere'?",
      options: [
        "A) Python",
        "B) JavaScript",
        "C) Java",
        "D) C++"
      ],
      correct_answer: "C",
      explanation: "Java's motto is 'write once, run anywhere' due to its bytecode and JVM.",
      category: "Programming",
      difficulty: "medium"
    },
    {
      id: "mcq_3",
      type: "mcq", 
      question: "What is 2 + 2?",
      options: [
        "A) 3",
        "B) 4",
        "C) 5", 
        "D) 6"
      ],
      correct_answer: "B",
      explanation: "Basic arithmetic: 2 + 2 = 4",
      category: "Math",
      difficulty: "easy"
    }
  ],

  // True/False Questions
  true_false: [
    {
      id: "tf_1",
      type: "true_false",
      question: "The Earth is flat.",
      correct_answer: false,
      explanation: "The Earth is approximately spherical, not flat.",
      category: "Science",
      difficulty: "easy"
    },
    {
      id: "tf_2",
      type: "true_false", 
      question: "JavaScript and Java are the same programming language.",
      correct_answer: false,
      explanation: "JavaScript and Java are completely different programming languages.",
      category: "Programming",
      difficulty: "easy"
    },
    {
      id: "tf_3",
      type: "true_false",
      question: "Water boils at 100°C at sea level.",
      correct_answer: true,
      explanation: "Water boils at 100°C (212°F) at standard atmospheric pressure.",
      category: "Science", 
      difficulty: "easy"
    }
  ],

  // Matching Questions
  matching: [
    {
      id: "match_1",
      type: "matching",
      question: "Match the countries with their capitals:",
      pairs: [
        { left: "France", right: "Paris" },
        { left: "Germany", right: "Berlin" },
        { left: "Italy", right: "Rome" },
        { left: "Spain", right: "Madrid" }
      ],
      explanation: "These are the capital cities of major European countries.",
      category: "Geography",
      difficulty: "medium"
    },
    {
      id: "match_2", 
      type: "matching",
      question: "Match the programming concepts:",
      pairs: [
        { left: "Variable", right: "Stores data" },
        { left: "Function", right: "Reusable code block" },
        { left: "Loop", right: "Repeats code" },
        { left: "Array", right: "List of items" }
      ],
      explanation: "Basic programming concepts and their definitions.",
      category: "Programming",
      difficulty: "medium"
    },
    {
      id: "match_3",
      type: "matching",
      question: "Match the animals with their habitats:",
      pairs: [
        { left: "Penguin", right: "Antarctica" },
        { left: "Kangaroo", right: "Australia" },
        { left: "Panda", right: "China" },
        { left: "Lion", right: "Africa" }
      ],
      explanation: "Animals and their natural habitats around the world.",
      category: "Biology",
      difficulty: "easy"
    }
  ],

  // Fill in the Blank Questions
  fill_blank: [
    {
      id: "fill_1",
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
    {
      id: "fill_2",
      type: "fill_blank", 
      question: "In JavaScript, we use ___BLANK_1___ to declare a variable and ___BLANK_2___ to declare a constant.",
      text: "In JavaScript, we use ___BLANK_1___ to declare a variable and ___BLANK_2___ to declare a constant.",
      blanks: {
        1: ["let", "var"],
        2: ["const"]
      },
      explanation: "In modern JavaScript, 'let' or 'var' declares variables, 'const' declares constants.",
      category: "Programming",
      difficulty: "medium"
    },
    {
      id: "fill_3",
      type: "fill_blank",
      question: "Water freezes at ___BLANK_1___ degrees Celsius.",
      text: "Water freezes at ___BLANK_1___ degrees Celsius.", 
      blanks: {
        1: ["0", "zero"]
      },
      explanation: "Water freezes at 0°C (32°F) at standard pressure.",
      category: "Science",
      difficulty: "easy"
    }
  ],

  // Ordering/Sequence Questions
  ordering: [
    {
      id: "order_1",
      type: "ordering",
      question: "Arrange these planets in order from the Sun:",
      items: ["Mars", "Earth", "Mercury", "Venus"],
      correct_sequence: ["Mercury", "Venus", "Earth", "Mars"],
      explanation: "The correct order from the Sun is: Mercury, Venus, Earth, Mars.",
      category: "Astronomy",
      difficulty: "medium"
    },
    {
      id: "order_2",
      type: "ordering", 
      question: "Arrange these programming steps in the correct order:",
      items: ["Test code", "Write code", "Plan solution", "Debug issues"],
      correct_sequence: ["Plan solution", "Write code", "Test code", "Debug issues"],
      explanation: "The software development process: Plan → Write → Test → Debug.",
      category: "Programming",
      difficulty: "medium"
    },
    {
      id: "order_3",
      type: "ordering",
      question: "Arrange these numbers in ascending order:",
      items: ["use functions", "import classes", "define vars", "use vars"],
      correct_sequence: ["import classes", "define vars", "use vars", "use functions"],
      explanation: "Ascending order means from smallest to largest.",
      category: "Math", 
      difficulty: "easy"
    }
  ]
};

// Game-specific mock data sets
export const hangmanMockData = {
  questions: [
    ...mockQuestions.mcq,
    ...mockQuestions.true_false,
    ...mockQuestions.fill_blank
  ]
};

export const towerMockData = {
  questions: [
    ...mockQuestions.mcq,
    ...mockQuestions.true_false,
    ...mockQuestions.matching
  ],
  metadata: {
    totalLevels: 5
  }
};

export const ladderMockData = {
  questions: [
    ...mockQuestions.mcq,
    ...mockQuestions.ordering,
    ...mockQuestions.true_false
  ]
};

// All question types combined for comprehensive testing
export const allQuestionTypes = {
  questions: [
    ...mockQuestions.mcq,
    ...mockQuestions.true_false, 
    ...mockQuestions.matching,
    ...mockQuestions.fill_blank,
    ...mockQuestions.ordering
  ]
};

// Legacy format converters for backward compatibility
export const createLegacyWordData = (question) => ({
  id: question.id,
  word_data: JSON.stringify({
    word: question.correct_answer,
    hint: question.question,
    category: question.category || 'General'
  }),
  type: 'word',
  category: question.category
});

export const createLegacyLadderSteps = (question) => ({
  id: question.id,
  ladder_steps: JSON.stringify({
    type: 'code_analysis',
    question: question.question,
    options: question.options || ['True', 'False'],
    correct_answer: question.correct_answer
  }),
  type: 'ladder'
});

// Utility function to get random questions of specific types
export const getRandomQuestions = (types = ['mcq'], count = 5) => {
  const selectedQuestions = [];
  
  types.forEach(type => {
    if (mockQuestions[type]) {
      selectedQuestions.push(...mockQuestions[type]);
    }
  });
  
  // Shuffle and return requested count
  const shuffled = selectedQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Development helper to inject mock data
export const injectMockData = (gameType = 'all') => {
  const mockDataMap = {
    hangman: hangmanMockData,
    tower: towerMockData, 
    ladder: ladderMockData,
    all: allQuestionTypes
  };
  
  return mockDataMap[gameType] || allQuestionTypes;
};
