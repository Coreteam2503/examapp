const { OpenAI } = require('openai');

class PromptService {
  constructor() {
    this.openai = null;
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
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz questions');
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
   * Test prompt effectiveness with sample content
   */
  async testPrompts() {
    const testContent = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function memoizedFibonacci() {
  const cache = {};
  return function fib(n) {
    if (n in cache) return cache[n];
    if (n <= 1) return n;
    cache[n] = fib(n - 1) + fib(n - 2);
    return cache[n];
  };
}
`;

    console.log('Testing prompt effectiveness...');
    
    try {
      const result = await this.generateQuizFromContent(testContent, {
        difficulty: 'medium',
        numQuestions: 3
      });
      
      console.log('✅ Prompt test successful');
      console.log('Generated questions:', result.questions.length);
      return result;
    } catch (error) {
      console.error('❌ Prompt test failed:', error);
      throw error;
    }
  }
}

module.exports = PromptService;
