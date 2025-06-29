/**
 * Fallback Quiz Generator - Handles quiz generation when OpenAI is not available
 */
class FallbackQuizGenerator {

  /**
   * Generate content using fallback methods
   */
  generateContent(prompt) {
    console.log('🔄 [FallbackQuizGenerator] Using fallback generator for content generation...');
    
    // Return fallback based on game type detected in prompt
    if (prompt.toLowerCase().includes('hangman')) {
      console.log('🎮 [FallbackQuizGenerator] Detected Hangman game request');
      
      // Generate multiple words for Hangman based on the prompt
      const wordsNeeded = prompt.match(/(\d+)\s+words?/i)?.[1] || 5;
      const words = [
        { word: "PROGRAMMING", category: "Technology", hint: "The process of creating software" },
        { word: "ALGORITHM", category: "Computer Science", hint: "Step-by-step procedure for solving problems" },
        { word: "DATABASE", category: "Technology", hint: "Organized collection of structured information" },
        { word: "FUNCTION", category: "Programming", hint: "Reusable block of code that performs a task" },
        { word: "VARIABLE", category: "Programming", hint: "Storage location with an associated name" }
      ];
      
      const questions = words.slice(0, parseInt(wordsNeeded)).map((wordData, index) => ({
        id: index + 1,
        word_data: wordData,
        correct_answer: wordData.word,
        max_attempts: 6,
        difficulty: "medium",
        concepts: ["programming"]
      }));
      
      return JSON.stringify({
        title: "Hangman Game",
        metadata: { maxWrongGuesses: 6, totalWords: questions.length },
        questions
      });
    } else if (prompt.toLowerCase().includes('knowledge tower')) {
      console.log('🎮 [FallbackQuizGenerator] Detected Knowledge Tower game request');
      
      // Extract number of levels from prompt
      const levelsNeeded = prompt.match(/(\d+)\s+(?:levels?|questions?)/i)?.[1] || 5;
      
      // Generate diverse question types
      const questionTypes = ['mcq', 'true_false', 'matching'];
      const levelThemes = ['Fundamentals', 'Understanding', 'Application', 'Analysis', 'Synthesis'];
      const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
      
      const questions = [];
      for (let i = 0; i < levelsNeeded; i++) {
        const questionType = questionTypes[i % questionTypes.length];
        const levelTheme = levelThemes[i % levelThemes.length];
        const difficulty = difficulties[i] || 'medium';
        
        let questionData = {
          level_number: i + 1,
          type: questionType,
          level_theme: levelTheme,
          difficulty: difficulty,
          concepts: ["programming", "concepts"]
        };
        
        switch (questionType) {
          case 'mcq':
            questionData = {
              ...questionData,
              question: `What is the main concept in level ${i + 1}?`,
              options: ["A) Programming fundamentals", "B) Data structures", "C) Algorithms", "D) Software design"],
              correct_answer: "A",
              explanation: "Programming fundamentals are the core concepts."
            };
            break;
            
          case 'true_false':
            questionData = {
              ...questionData,
              question: `Programming involves writing code to solve problems.`,
              correct_answer: true,
              explanation: "Programming is indeed about writing code to solve problems."
            };
            break;
            
          case 'matching':
            questionData = {
              ...questionData,
              question: "Match the programming concepts with their descriptions:",
              leftItems: ["Variable", "Function", "Loop", "Array"],
              rightItems: ["Stores data", "Reusable code block", "Repeats actions", "Stores multiple values"],
              correctPairs: [[0, 0], [1, 1], [2, 2], [3, 3]],
              explanation: "Each concept matches with its appropriate description."
            };
            break;
        }
        
        questions.push(questionData);
      }
      
      return JSON.stringify({
        title: "Knowledge Tower Game",
        metadata: { totalLevels: questions.length, progressiveLearning: true },
        questions
      });
    } else if (prompt.toLowerCase().includes('word ladder')) {
      console.log('🎮 [FallbackQuizGenerator] Detected Word Ladder game request');
      
      // Generate code analysis questions instead of word transformations
      const codeQuestions = [
        {
          question: "What does this function accomplish?",
          code_snippet: "def process_data(items):\n    return [x * 2 for x in items if x > 0]",
          options: ["A) Doubles positive numbers in a list", "B) Filters negative numbers", "C) Sorts the list", "D) Removes duplicates"],
          correct_answer: "A",
          explanation: "This function uses list comprehension to double all positive numbers in the input list",
          question_type: "functionality"
        },
        {
          question: "What will be the output of this code?",
          code_snippet: "x = [1, 2, 3]\nprint(len(x))",
          options: ["A) [1, 2, 3]", "B) 3", "C) 6", "D) Error"],
          correct_answer: "B",
          explanation: "len() function returns the number of items in the list",
          question_type: "output"
        },
        {
          question: "Which concept is demonstrated in this example?",
          code_snippet: "class Animal:\n    def __init__(self, name):\n        self.name = name",
          options: ["A) Inheritance", "B) Encapsulation", "C) Constructor method", "D) Polymorphism"],
          correct_answer: "C",
          explanation: "__init__ is the constructor method in Python classes",
          question_type: "concept"
        },
        {
          question: "What is the purpose of this parameter?",
          code_snippet: "def calculate(data, threshold=0.5):\n    return sum(x for x in data if x > threshold)",
          options: ["A) Default minimum value", "B) Maximum allowed value", "C) Error handling", "D) Data type conversion"],
          correct_answer: "A",
          explanation: "threshold=0.5 sets a default minimum value for filtering data",
          question_type: "parameter"
        },
        {
          question: "What happens when you run this code?",
          code_snippet: "try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    result = 0",
          options: ["A) Program crashes", "B) result becomes 0", "C) result becomes infinity", "D) result stays undefined"],
          correct_answer: "B",
          explanation: "The except block catches the division by zero error and sets result to 0",
          question_type: "execution"
        }
      ];
      
      const questionsNeeded = prompt.match(/(\d+)\s+questions?/i)?.[1] || 3;
      const selectedQuestions = codeQuestions.slice(0, parseInt(questionsNeeded)).map((q, index) => ({
        id: index + 1,
        ladder_steps: {
          type: 'code_analysis',
          question: q.question,
          code_snippet: q.code_snippet,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          question_type: q.question_type,
          concepts: ["programming", "code analysis"]
        },
        correct_answer: q.correct_answer,
        difficulty: "medium",
        concepts: ["programming", "code analysis"]
      }));
      
      return JSON.stringify({
        title: "Code Analysis - Word Ladder Game",
        metadata: { 
          totalQuestions: selectedQuestions.length,
          gameType: "code_analysis",
          difficulty: "medium"
        },
        questions: selectedQuestions
      });
    } else if (prompt.toLowerCase().includes('memory grid')) {
      console.log('🎮 [FallbackQuizGenerator] Detected Memory Grid game request');
      return JSON.stringify({
        title: "Memory Grid Game",
        metadata: { gridSize: 4, memoryTime: 5, totalPatterns: 1 },
        questions: [{
          pattern_data: {
            grid: [
              ["🔧", "💻"],
              ["📝", "🔧"]
            ],
            sequence: [0, 3],
            symbols: ["🔧", "💻", "📝"]
          },
          correct_answer: "[0,3]",
          difficulty: "medium",
          concepts: ["patterns", "memory"]
        }]
      });
    }

    // Generic fallback
    console.log('🔧 [FallbackQuizGenerator] Using generic fallback content');
    return JSON.stringify({
      title: "Programming Quiz",
      metadata: { totalQuestions: 1 },
      questions: [{
        question: "What is the main concept in this content?",
        correct_answer: "Programming",
        difficulty: "medium",
        concepts: ["programming"]
      }]
    });
  }

  /**
   * Built-in fallback quiz generator when MockQuizGenerator is not available
   */
  getBuiltInFallbackQuiz(content, options = {}) {
    const { difficulty = 'medium', numQuestions = 5, questionTypes = ['multiple_choice'] } = options;
    
    console.log('🔧 [FallbackQuizGenerator] Using built-in fallback quiz generator');
    console.log('📝 [FallbackQuizGenerator] Fallback parameters:', { difficulty, numQuestions, questionTypes });
    
    const questions = [];
    for (let i = 1; i <= Math.min(numQuestions, 5); i++) {
      console.log(`🔧 [FallbackQuizGenerator] Generating fallback question ${i}`);
      questions.push({
        id: i,
        type: 'multiple_choice',
        question: `Question ${i}: What is a key concept from this content?`,
        options: [
          "A) Programming fundamentals",
          "B) Data structures", 
          "C) Algorithms",
          "D) Software design"
        ],
        correct_answer: "A",
        explanation: "This is a sample question generated from the content.",
        difficulty: difficulty,
        concepts: ["programming", "basics"]
      });
    }
    
    const result = {
      questions,
      metadata: {
        total_questions: questions.length,
        difficulty: difficulty,
        content_type: "text",
        main_concepts: ["programming", "software development"],
        generated_by: "built-in-fallback"
      }
    };

    console.log('✅ [FallbackQuizGenerator] Built-in fallback quiz generated successfully');
    console.log('📊 [FallbackQuizGenerator] Fallback result:', {
      questionsCount: result.questions.length,
      generatedBy: result.metadata.generated_by
    });

    return result;
  }

  /**
   * Generate quiz from content using fallback method
   */
  generateQuizFromContent(content, options) {
    console.log('🎯 [FallbackQuizGenerator] Using MockQuizGenerator...');
    
    try {
      const MockQuizGenerator = require('./fallback/mockQuizGenerator');
      const mockGenerator = new MockQuizGenerator();
      const result = mockGenerator.generateQuizFromContent(content, options);
      console.log('✅ [FallbackQuizGenerator] Fallback quiz generation completed');
      return result;
    } catch (error) {
      console.log('🔧 [FallbackQuizGenerator] MockQuizGenerator not available, using built-in fallback');
      return this.getBuiltInFallbackQuiz(content, options);
    }
  }

  /**
   * Generate Hangman-specific fallback content
   */
  generateHangmanFallback(numWords = 5) {
    const words = [
      { word: "PROGRAMMING", category: "Technology", hint: "The process of creating software" },
      { word: "ALGORITHM", category: "Computer Science", hint: "Step-by-step procedure for solving problems" },
      { word: "DATABASE", category: "Technology", hint: "Organized collection of structured information" },
      { word: "FUNCTION", category: "Programming", hint: "Reusable block of code that performs a task" },
      { word: "VARIABLE", category: "Programming", hint: "Storage location with an associated name" },
      { word: "ARRAY", category: "Programming", hint: "Data structure that stores multiple values" },
      { word: "LOOP", category: "Programming", hint: "Repeating structure in code" }
    ];
    
    const questions = words.slice(0, numWords).map((wordData, index) => ({
      id: index + 1,
      word_data: wordData,
      correct_answer: wordData.word,
      max_attempts: 6,
      difficulty: "medium",
      concepts: ["programming"]
    }));
    
    return {
      title: "Hangman Game",
      metadata: { maxWrongGuesses: 6, totalWords: questions.length, generated_by: "fallback" },
      questions
    };
  }
}

module.exports = FallbackQuizGenerator;