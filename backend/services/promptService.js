/**
 * PromptService - Enhanced with fallback quiz generator
 * Handles LLM-based quiz generation with fallback support
 */
const { OpenAI } = require('openai');
let MockQuizGenerator;
try {
  MockQuizGenerator = require('./fallback/mockQuizGenerator');
} catch (error) {
  console.warn('MockQuizGenerator not found, using built-in fallback');
  MockQuizGenerator = null;
}

class PromptService {
  constructor() {
    this.openai = null;
    this.mockGenerator = MockQuizGenerator ? new MockQuizGenerator() : null;
    this.useOpenAI = !!process.env.OPENAI_API_KEY;
    
    if (!this.useOpenAI) {
      console.log('⚠️  OpenAI API key not found. Using fallback quiz generator.');
      console.log('   For better quiz quality, please set OPENAI_API_KEY in your .env file.');
    }
  }

  /**
   * Initialize OpenAI client (lazy initialization)
   */
  initializeOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Generate multiple choice questions from code/text content
   * @param {string} content - The code or text content to analyze
   * @param {object} options - Generation options (difficulty, numQuestions, etc.)
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateQuizFromContent(content, options = {}) {
    const {
      difficulty = 'medium',
      numQuestions = 5,
      questionTypes = ['multiple_choice'],
      language = 'auto-detect'
    } = options;

    // Use fallback if OpenAI is not available
    if (!this.useOpenAI) {
      console.log('🔄 Generating quiz using fallback generator...');
      if (this.mockGenerator) {
        return this.mockGenerator.generateQuizFromContent(content, {
          difficulty,
          numQuestions,
          questionTypes,
          language
        });
      } else {
        // Built-in fallback if MockQuizGenerator is not available
        return this.getBuiltInFallbackQuiz(content, { difficulty, numQuestions, questionTypes });
      }
    }

    const prompt = this.buildQuizGenerationPrompt(content, {
      difficulty,
      numQuestions,
      questionTypes,
      language
    });

    try {
      const openai = this.initializeOpenAI();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000 // Increased for fill-in-blank questions
      });

      const rawResponse = response.choices[0].message.content;
      return this.parseQuizResponse(rawResponse);
    } catch (error) {
      console.error('Error generating quiz with OpenAI:', error);
      console.log('🔄 Falling back to pattern-based generator...');
      
      // Fallback to mock generator if OpenAI fails
      if (this.mockGenerator) {
        return this.mockGenerator.generateQuizFromContent(content, {
          difficulty,
          numQuestions,
          questionTypes,
          language
        });
      } else {
        return this.getBuiltInFallbackQuiz(content, { difficulty, numQuestions, questionTypes });
      }
    }
  }

  /**
   * Generate content using the appropriate LLM service
   * @param {string} prompt - The prompt to send to the LLM
   * @returns {Promise<string>} The generated content
   */
  async generateContent(prompt) {
    // Use fallback if OpenAI is not available
    if (!this.useOpenAI) {
      console.log('🔄 Using fallback generator for content generation...');
      // Return fallback based on game type detected in prompt
      if (prompt.toLowerCase().includes('hangman')) {
        return JSON.stringify({
          title: "Hangman Game",
          metadata: { maxWrongGuesses: 6, totalWords: 1 },
          questions: [{
            word_data: {
              word: "PROGRAMMING",
              category: "Technology",
              hint: "The process of creating software"
            },
            correct_answer: "PROGRAMMING",
            max_attempts: 6,
            difficulty: "medium",
            concepts: ["programming"]
          }]
        });
      } else if (prompt.toLowerCase().includes('knowledge tower')) {
        return JSON.stringify({
          title: "Knowledge Tower Game",
          metadata: { totalLevels: 5, progressiveLearning: true },
          questions: [{
            level_number: 1,
            question: "What is the main topic of this content?",
            options: ["Programming", "Cooking", "Sports", "History"],
            correct_answer: "Programming",
            level_theme: "Fundamentals",
            difficulty: "easy",
            concepts: ["basics"]
          }]
        });
      } else if (prompt.toLowerCase().includes('word ladder')) {
        return JSON.stringify({
          title: "Word Ladder Game",
          metadata: { maxSteps: 8, totalLadders: 1 },
          questions: [{
            ladder_steps: {
              startWord: "CODE",
              endWord: "NODE",
              steps: ["CODE", "NODE"],
              hints: ["Programming instruction", "Network point"]
            },
            correct_answer: "NODE",
            difficulty: "medium",
            concepts: ["programming"]
          }]
        });
      } else if (prompt.toLowerCase().includes('memory grid')) {
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

    try {
      const openai = this.initializeOpenAI();
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that generates educational content. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating content with OpenAI:', error);
      console.log('🔄 Falling back to simple content generation...');
      
      // Return game-specific fallback based on prompt content
      if (prompt.toLowerCase().includes('hangman')) {
        return JSON.stringify({
          title: "Hangman Game",
          metadata: { maxWrongGuesses: 6, totalWords: 1 },
          questions: [{
            word_data: {
              word: "PROGRAMMING",
              category: "Technology",
              hint: "The process of creating software"
            },
            correct_answer: "PROGRAMMING",
            max_attempts: 6,
            difficulty: "medium",
            concepts: ["programming"]
          }]
        });
      }

      // Generic fallback
      return JSON.stringify({
        title: "Programming Content",
        metadata: { totalQuestions: 1 },
        questions: [{
          question: "What is the main concept in this content?",
          correct_answer: "Programming",
          difficulty: "medium",
          concepts: ["programming"]
        }]
      });
    }
  }

  /**
   * System prompt for quiz generation
   */
  getSystemPrompt() {
    return `You are an expert educational content creator specialized in generating high-quality quiz questions from code and technical content.

Your responsibilities:
1. Analyze the provided content and extract key concepts, functions, patterns, and logic
2. Generate educational questions that test understanding, not just memorization
3. Create questions at appropriate difficulty levels
4. Ensure questions are technically accurate and pedagogically sound
5. Format responses in valid JSON structure

Guidelines:
- Focus on concepts, logic, best practices, and problem-solving
- Avoid trivial syntax questions unless specifically requested
- Include code snippets in questions when relevant
- Make distractors (wrong answers) plausible but clearly incorrect
- Ensure questions test different cognitive levels (comprehension, application, analysis)`;
  }

  /**
   * Build the main quiz generation prompt
   */
  buildQuizGenerationPrompt(content, options) {
    const { difficulty, numQuestions, questionTypes, language } = options;

    return `Please analyze the following ${language !== 'auto-detect' ? language : ''} content and generate ${numQuestions} high-quality quiz questions.

CONTENT TO ANALYZE:
\`\`\`
${content}
\`\`\`

REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Number of Questions: ${numQuestions}
- Question Types: ${questionTypes.join(', ')}
- Focus on understanding concepts, not just syntax memorization
- Include relevant code snippets in questions when helpful
- Make sure each question tests different aspects of the content

QUESTION TYPE GUIDELINES:

1. MULTIPLE CHOICE (multiple_choice):
   - Provide 4 options (A, B, C, D)
   - Make distractors plausible but clearly wrong
   - Test conceptual understanding

2. FILL-IN-THE-BLANK (fill_in_the_blank):
   - Use ___BLANK_1___, ___BLANK_2___ etc. for blanks in the question text
   - Provide correctAnswers object with possible answers for each blank
   - Focus on key terms, function names, or critical concepts
   - Include hint if helpful

3. TRUE/FALSE (true_false):
   - Create statements that can be definitively true or false
   - Avoid ambiguous statements
   - Focus on specific facts or concepts

4. DRAG & DROP MATCHING (drag_drop_match):
   - Create pairs of related concepts
   - Provide an array of pairs with 'left' and 'right' properties
   - Focus on definitions, relationships, or associations

5. DRAG & DROP ORDERING (drag_drop_order):
   - Provide items that need to be placed in correct sequence
   - Include the correct order in the correctOrder array
   - Focus on processes, steps, or chronological concepts

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What does this function accomplish?",
      "code_snippet": "// optional code snippet",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "medium",
      "concepts": ["concept1", "concept2"]
    },
    {
      "id": 2,
      "type": "fill_in_the_blank",
      "question": "The ___BLANK_1___ function is used to ___BLANK_2___ elements from an array.",
      "text": "The ___BLANK_1___ function is used to ___BLANK_2___ elements from an array.",
      "code_snippet": "// optional code snippet",
      "correctAnswers": {
        "1": ["filter", "Filter"],
        "2": ["remove", "exclude", "select"]
      },
      "hint": "Think about array methods that create new arrays",
      "explanation": "Detailed explanation",
      "difficulty": "medium",
      "concepts": ["arrays", "methods"]
    },
    {
      "id": 3,
      "type": "true_false",
      "question": "JavaScript arrays are mutable objects.",
      "correct_answer": true,
      "explanation": "Arrays in JavaScript are indeed mutable objects.",
      "difficulty": "easy",
      "concepts": ["arrays", "mutability"]
    },
    {
      "id": 4,
      "type": "drag_drop_match",
      "question": "Match the JavaScript method with its purpose:",
      "pairs": [
        {"left": "map()", "right": "Creates new array with transformed elements"},
        {"left": "filter()", "right": "Creates new array with selected elements"},
        {"left": "reduce()", "right": "Reduces array to single value"}
      ],
      "explanation": "Each array method has a specific purpose for data transformation.",
      "difficulty": "medium",
      "concepts": ["array methods", "functional programming"]
    },
    {
      "id": 5,
      "type": "drag_drop_order",
      "question": "Arrange these steps in the correct order for handling an API request:",
      "items": ["Send request", "Parse response", "Handle errors", "Validate data"],
      "correctOrder": ["Send request", "Handle errors", "Parse response", "Validate data"],
      "explanation": "API requests should follow this logical sequence.",
      "difficulty": "medium",
      "concepts": ["API", "error handling", "data processing"]
    }
  ],
  "metadata": {
    "total_questions": ${numQuestions},
    "difficulty": "${difficulty}",
    "content_type": "detected content type",
    "main_concepts": ["list of main concepts covered"]
  }
}

Generate the questions now:`;
  }

  /**
   * Parse the LLM response and validate the structure
   */
  parseQuizResponse(rawResponse) {
    try {
      // Clean the response (remove any markdown formatting)
      const cleanedResponse = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      // Validate the structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure: missing questions array');
      }

      // Validate each question
      parsed.questions.forEach((question, index) => {
        const required = ['id', 'type', 'question', 'explanation'];
        required.forEach(field => {
          if (!question[field]) {
            throw new Error(`Question ${index + 1} missing required field: ${field}`);
          }
        });

        // Validate multiple choice structure
        if (question.type === 'multiple_choice' || question.type === 'multiple-choice') {
          if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
            throw new Error(`Question ${index + 1} must have at least 2 options`);
          }
          if (!question.correct_answer) {
            throw new Error(`Question ${index + 1} missing correct_answer`);
          }
        }

        // Validate fill-in-the-blank structure
        if (question.type === 'fill_in_the_blank' || question.type === 'fill-in-the-blank') {
          if (!question.correctAnswers || typeof question.correctAnswers !== 'object') {
            throw new Error(`Question ${index + 1} missing correctAnswers object`);
          }
          // Ensure text field exists for fill-in-the-blank
          if (!question.text) {
            question.text = question.question;
          }
        }

        // Validate true/false structure
        if (question.type === 'true_false' || question.type === 'true-false') {
          if (question.correct_answer === undefined || question.correct_answer === null) {
            throw new Error(`Question ${index + 1} missing correct_answer for true/false`);
          }
        }

        // Validate drag & drop matching structure
        if (question.type === 'drag_drop_match') {
          if (!question.pairs || !Array.isArray(question.pairs) || question.pairs.length === 0) {
            throw new Error(`Question ${index + 1} missing pairs array for drag_drop_match`);
          }
          question.pairs.forEach((pair, pairIndex) => {
            if (!pair.left || !pair.right) {
              throw new Error(`Question ${index + 1}, pair ${pairIndex + 1} missing left or right property`);
            }
          });
        }

        // Validate drag & drop ordering structure
        if (question.type === 'drag_drop_order') {
          if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
            throw new Error(`Question ${index + 1} missing items array for drag_drop_order`);
          }
          if (!question.correctOrder || !Array.isArray(question.correctOrder)) {
            throw new Error(`Question ${index + 1} missing correctOrder array for drag_drop_order`);
          }
        }
      });

      return parsed;
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      console.error('Raw response:', rawResponse);
      throw new Error('Failed to parse quiz response: ' + error.message);
    }
  }

  /**
   * Generate questions for specific difficulty levels
   */
  async generateByDifficulty(content, difficulty) {
    const difficultySettings = {
      'easy': {
        numQuestions: 3,
        questionTypes: ['multiple_choice'],
        focus: 'basic understanding and recognition'
      },
      'medium': {
        numQuestions: 5,
        questionTypes: ['multiple_choice'],
        focus: 'application and analysis'
      },
      'hard': {
        numQuestions: 7,
        questionTypes: ['multiple_choice'],
        focus: 'synthesis and evaluation'
      }
    };

    const settings = difficultySettings[difficulty] || difficultySettings['medium'];
    return this.generateQuizFromContent(content, { difficulty, ...settings });
  }

  /**
   * Built-in fallback quiz generator when MockQuizGenerator is not available
   */
  getBuiltInFallbackQuiz(content, options = {}) {
    const { difficulty = 'medium', numQuestions = 5, questionTypes = ['multiple_choice'] } = options;
    
    console.log('Using built-in fallback quiz generator');
    
    const questions = [];
    for (let i = 1; i <= Math.min(numQuestions, 5); i++) {
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
    
    return {
      questions,
      metadata: {
        total_questions: questions.length,
        difficulty: difficulty,
        content_type: "text",
        main_concepts: ["programming", "software development"],
        generated_by: "built-in-fallback"
      }
    };
  }
}

module.exports = PromptService;
