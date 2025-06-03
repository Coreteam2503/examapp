/**
 * Fallback quiz generator for when external LLM APIs are not available
 * This creates basic questions from code content using pattern matching
 */

class MockQuizGenerator {
  /**
   * Generate quiz questions from code content using pattern matching
   * @param {string} content - The code content to analyze
   * @param {object} options - Generation options
   * @returns {object} Quiz data in the same format as LLM response
   */
  generateQuizFromContent(content, options = {}) {
    const {
      difficulty = 'medium',
      numQuestions = 5,
      questionTypes = ['multiple_choice'],
      language = 'auto-detect'
    } = options;

    // Detect programming language if not specified
    const detectedLanguage = language === 'auto-detect' ? this.detectLanguage(content) : language;
    
    // Extract code patterns and generate questions
    const patterns = this.extractCodePatterns(content, detectedLanguage);
    
    // Generate questions based on patterns
    const questions = this.generateQuestionsFromPatterns(patterns, {
      difficulty,
      numQuestions,
      questionTypes,
      language: detectedLanguage
    });

    return {
      questions: questions.slice(0, numQuestions),
      metadata: {
        total_questions: Math.min(questions.length, numQuestions),
        difficulty: difficulty,
        content_type: detectedLanguage,
        main_concepts: patterns.concepts,
        generated_by: 'fallback_generator',
        note: 'Generated using pattern matching. For better questions, please configure OpenAI API key.'
      }
    };
  }

  /**
   * Detect programming language from content
   */
  detectLanguage(content) {
    const languagePatterns = {
      javascript: [/function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/, /=>\s*{/, /console\.log/],
      python: [/def\s+\w+/, /import\s+\w+/, /from\s+\w+\s+import/, /if\s+__name__\s*==\s*['"']__main__['"]/, /print\(/],
      java: [/public\s+class\s+\w+/, /public\s+static\s+void\s+main/, /System\.out\.println/, /private\s+\w+/, /public\s+\w+/],
      cpp: [/#include\s*</, /int\s+main\s*\(/, /std::/, /cout\s*<</, /using\s+namespace/],
      css: [/\w+\s*{[^}]*}/, /\.\w+\s*{/, /#\w+\s*{/, /@media/, /font-family:/],
      html: [/<html/, /<head/, /<body/, /<div/, /<script/],
      sql: [/SELECT\s+/, /FROM\s+/, /WHERE\s+/, /INSERT\s+INTO/, /UPDATE\s+/, /DELETE\s+FROM/]
    };

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return lang;
      }
    }

    return 'text';
  }

  /**
   * Extract code patterns for question generation
   */
  extractCodePatterns(content, language) {
    const patterns = {
      functions: [],
      variables: [],
      keywords: [],
      concepts: [],
      codeBlocks: []
    };

    // Extract functions
    const functionPatterns = {
      javascript: /function\s+(\w+)\s*\([^)]*\)|(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      python: /def\s+(\w+)\s*\([^)]*\):/g,
      java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\([^)]*\)/g,
      cpp: /\w+\s+(\w+)\s*\([^)]*\)/g
    };

    if (functionPatterns[language]) {
      let match;
      while ((match = functionPatterns[language].exec(content)) !== null) {
        patterns.functions.push(match[1] || match[2]);
      }
    }

    // Extract variables (basic patterns)
    const variablePatterns = {
      javascript: /(?:const|let|var)\s+(\w+)/g,
      python: /(\w+)\s*=/g,
      java: /(?:int|String|boolean|double|float)\s+(\w+)/g
    };

    if (variablePatterns[language]) {
      let match;
      while ((match = variablePatterns[language].exec(content)) !== null) {
        patterns.variables.push(match[1]);
      }
    }

    // Extract language-specific keywords and concepts
    patterns.concepts = this.extractConcepts(content, language);
    patterns.codeBlocks = this.extractCodeBlocks(content);

    return patterns;
  }

  /**
   * Extract key concepts from code
   */
  extractConcepts(content, language) {
    const concepts = [];
    
    const conceptPatterns = {
      javascript: {
        'async/await': /async|await/g,
        'promises': /Promise|\.then|\.catch/g,
        'arrow functions': /=>/g,
        'destructuring': /\{[^}]*\}\s*=/g,
        'loops': /for\s*\(|while\s*\(/g,
        'conditionals': /if\s*\(|switch\s*\(/g,
        'classes': /class\s+\w+/g,
        'modules': /import|export/g
      },
      python: {
        'list comprehension': /\[.*for.*in.*\]/g,
        'classes': /class\s+\w+/g,
        'functions': /def\s+\w+/g,
        'loops': /for\s+\w+\s+in|while\s+/g,
        'conditionals': /if\s+|elif\s+|else:/g,
        'exceptions': /try:|except:|finally:/g
      },
      java: {
        'classes': /class\s+\w+/g,
        'methods': /public\s+\w+|private\s+\w+/g,
        'inheritance': /extends\s+\w+/g,
        'interfaces': /implements\s+\w+/g,
        'loops': /for\s*\(|while\s*\(/g,
        'conditionals': /if\s*\(|switch\s*\(/g
      }
    };

    if (conceptPatterns[language]) {
      Object.entries(conceptPatterns[language]).forEach(([concept, pattern]) => {
        if (pattern.test(content)) {
          concepts.push(concept);
        }
      });
    }

    return concepts;
  }

  /**
   * Extract code blocks for questions
   */
  extractCodeBlocks(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const blocks = [];
    
    // Simple heuristic: take meaningful lines (not just braces or comments)
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && trimmed !== '{' && trimmed !== '}') {
        blocks.push({
          line: index + 1,
          content: trimmed
        });
      }
    });

    return blocks.slice(0, 10); // Limit to first 10 meaningful lines
  }

  /**
   * Generate questions from extracted patterns
   */
  generateQuestionsFromPatterns(patterns, options) {
    const { difficulty, questionTypes, language } = options;
    const questions = [];
    let questionId = 1;

    // Generate function-based questions
    if (patterns.functions.length > 0) {
      patterns.functions.slice(0, 2).forEach(funcName => {
        if (questionTypes.includes('multiple_choice')) {
          questions.push(this.createFunctionQuestion(questionId++, funcName, language, difficulty));
        }
      });
    }

    // Generate concept-based questions
    if (patterns.concepts.length > 0) {
      patterns.concepts.slice(0, 2).forEach(concept => {
        if (questionTypes.includes('multiple_choice')) {
          questions.push(this.createConceptQuestion(questionId++, concept, language, difficulty));
        }
      });
    }

    // Generate code analysis questions
    if (patterns.codeBlocks.length > 0) {
      patterns.codeBlocks.slice(0, 2).forEach(block => {
        if (questionTypes.includes('multiple_choice')) {
          questions.push(this.createCodeAnalysisQuestion(questionId++, block, language, difficulty));
        }
      });
    }

    // Generate fill-in-the-blank questions if requested
    if (questionTypes.includes('fill_in_the_blank') && patterns.codeBlocks.length > 0) {
      questions.push(this.createFillInBlankQuestion(questionId++, patterns.codeBlocks[0], language, difficulty));
    }

    // Add generic questions if we don't have enough
    while (questions.length < options.numQuestions) {
      questions.push(this.createGenericQuestion(questionId++, language, difficulty));
    }

    return questions;
  }

  /**
   * Create function-based question
   */
  createFunctionQuestion(id, funcName, language, difficulty) {
    const templates = {
      easy: {
        question: `What is the name of the function defined in this code?`,
        options: [
          `A) ${funcName}`,
          `B) ${funcName}Handler`,
          `C) process${funcName}`,
          `D) ${funcName}Method`
        ],
        correct: 'A'
      },
      medium: {
        question: `What is the primary purpose of the function "${funcName}"?`,
        options: [
          `A) To process and return data`,
          `B) To handle user input`,
          `C) To manage application state`,
          `D) To render UI components`
        ],
        correct: 'A'
      },
      hard: {
        question: `How would you optimize the "${funcName}" function for better performance?`,
        options: [
          `A) Add memoization`,
          `B) Use async/await`,
          `C) Implement caching`,
          `D) All of the above`
        ],
        correct: 'D'
      }
    };

    const template = templates[difficulty] || templates.medium;
    
    return {
      id,
      type: 'multiple_choice',
      question: template.question,
      options: template.options,
      correct_answer: template.correct,
      explanation: `This question tests understanding of the function "${funcName}" in the provided code.`,
      difficulty,
      concepts: ['functions', language]
    };
  }

  /**
   * Create concept-based question
   */
  createConceptQuestion(id, concept, language, difficulty) {
    const conceptQuestions = {
      'async/await': {
        question: 'What is the primary benefit of using async/await in JavaScript?',
        options: [
          'A) It makes code run faster',
          'B) It makes asynchronous code easier to read and write',
          'C) It automatically handles errors',
          'D) It converts synchronous code to asynchronous'
        ],
        correct: 'B'
      },
      'arrow functions': {
        question: 'What is a key difference between arrow functions and regular functions?',
        options: [
          'A) Arrow functions are faster',
          'B) Arrow functions have their own "this" binding',
          'C) Arrow functions inherit "this" from enclosing scope',
          'D) Arrow functions can only be used in classes'
        ],
        correct: 'C'
      },
      'loops': {
        question: 'When should you use a loop in programming?',
        options: [
          'A) When you need to repeat code execution',
          'B) When you need to make decisions',
          'C) When you need to define functions',
          'D) When you need to handle errors'
        ],
        correct: 'A'
      },
      'conditionals': {
        question: 'What is the purpose of conditional statements?',
        options: [
          'A) To repeat code execution',
          'B) To make decisions based on conditions',
          'C) To define variables',
          'D) To create functions'
        ],
        correct: 'B'
      }
    };

    const template = conceptQuestions[concept] || {
      question: `What is the purpose of ${concept} in ${language}?`,
      options: [
        'A) To improve code organization',
        'B) To enhance performance',
        'C) To provide functionality',
        'D) To handle errors'
      ],
      correct: 'C'
    };

    return {
      id,
      type: 'multiple_choice',
      question: template.question,
      options: template.options,
      correct_answer: template.correct,
      explanation: `This question tests understanding of ${concept} in ${language}.`,
      difficulty,
      concepts: [concept, language]
    };
  }

  /**
   * Create code analysis question
   */
  createCodeAnalysisQuestion(id, codeBlock, language, difficulty) {
    return {
      id,
      type: 'multiple_choice',
      question: 'What does this line of code accomplish?',
      code_snippet: codeBlock.content,
      options: [
        'A) Defines a variable',
        'B) Calls a function',
        'C) Creates a condition',
        'D) Performs an operation'
      ],
      correct_answer: 'D',
      explanation: `This question analyzes the purpose of the code: "${codeBlock.content}"`,
      difficulty,
      concepts: ['code analysis', language]
    };
  }

  /**
   * Create fill-in-the-blank question
   */
  createFillInBlankQuestion(id, codeBlock, language, difficulty) {
    // Simple approach: create a fill-in-blank from the code
    const code = codeBlock.content;
    const words = code.split(/\s+/);
    
    if (words.length > 2) {
      const blankIndex = Math.floor(words.length / 2);
      const blankWord = words[blankIndex];
      words[blankIndex] = '___BLANK_1___';
      
      return {
        id,
        type: 'fill_in_the_blank',
        question: `Fill in the blank to complete this ${language} code:`,
        text: words.join(' '),
        correctAnswers: {
          "1": [blankWord, blankWord.toLowerCase(), blankWord.toUpperCase()]
        },
        hint: `Think about ${language} syntax`,
        explanation: `The correct answer is "${blankWord}" which completes the ${language} statement.`,
        difficulty,
        concepts: ['syntax', language]
      };
    }

    // Fallback
    return this.createGenericQuestion(id, language, difficulty);
  }

  /**
   * Create generic question when specific patterns aren't available
   */
  createGenericQuestion(id, language, difficulty) {
    const genericQuestions = {
      javascript: {
        question: 'Which of the following is a JavaScript data type?',
        options: ['A) string', 'B) int', 'C) char', 'D) float'],
        correct: 'A'
      },
      python: {
        question: 'Which keyword is used to define a function in Python?',
        options: ['A) function', 'B) def', 'C) func', 'D) define'],
        correct: 'B'
      },
      java: {
        question: 'Which access modifier makes a member accessible only within the same class?',
        options: ['A) public', 'B) protected', 'C) private', 'D) default'],
        correct: 'C'
      },
      text: {
        question: 'What is the main topic of this content?',
        options: ['A) Programming concepts', 'B) Data structures', 'C) Algorithms', 'D) General information'],
        correct: 'D'
      }
    };

    const template = genericQuestions[language] || genericQuestions.text;

    return {
      id,
      type: 'multiple_choice',
      question: template.question,
      options: template.options,
      correct_answer: template.correct,
      explanation: `This is a general question about ${language} concepts.`,
      difficulty,
      concepts: ['general', language]
    };
  }
}

module.exports = MockQuizGenerator;