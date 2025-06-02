const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('Initializing AI Service...');
    console.log('API Key present:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
      console.warn('Please set OPENAI_API_KEY in your environment variables.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.isConfigured = true;
      console.log('OpenAI API client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error.message);
      this.isConfigured = false;
    }
  }

  // Test API connectivity
  async testConnection() {
    if (!this.isConfigured) {
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello! This is a test message. Please respond with "Connection successful!"'
          }
        ],
        max_tokens: 50,
        temperature: 0
      });

      return {
        success: true,
        message: 'OpenAI API connection successful',
        response: response.choices[0].message.content.trim(),
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      console.error('OpenAI API test failed:', error);
      return {
        success: false,
        message: 'OpenAI API connection failed',
        error: error.message
      };
    }
  }

  // Generate quiz questions from content
  async generateQuizQuestions(content, options = {}) {
    if (!this.isConfigured) {
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    const {
      numQuestions = 5,
      difficulty = 'medium',
      questionTypes = ['multiple-choice'],
      language = 'auto-detect'
    } = options;

    try {
      const prompt = this.buildQuizPrompt(content, {
        numQuestions,
        difficulty,
        questionTypes,
        language
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator specializing in generating high-quality quiz questions from code and technical content. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        questions: result.questions,
        metadata: {
          model: response.model,
          usage: response.usage,
          difficulty: difficulty,
          language: language,
          contentLength: content.length
        }
      };
    } catch (error) {
      console.error('Quiz generation failed:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  // Build the prompt for quiz generation
  buildQuizPrompt(content, options) {
    const { numQuestions, difficulty, questionTypes, language } = options;
    
    const questionTypeInstructions = {
      'multiple-choice': 'Multiple choice questions with 4 options (A, B, C, D)',
      'true-false': 'True or false questions about the content',
      'fill-in-the-blank': 'Fill-in-the-blank questions with missing keywords or values',
      'matching': 'Matching questions with pairs of related concepts'
    };
    
    const instructions = questionTypes.map(type => questionTypeInstructions[type] || type).join(', ');
    
    return `
Please analyze the following code/content and generate ${numQuestions} high-quality quiz questions.

CONTENT TO ANALYZE:
\`\`\`
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}
\`\`\`

REQUIREMENTS:
- Difficulty: ${difficulty}
- Question types: ${instructions}
- Language: ${language}
- Generate exactly ${numQuestions} questions
- Mix different question types if multiple types are specified
- Focus on understanding concepts, not just memorization
- Include varied difficulty within the specified level
- Make questions practical and relevant

RESPONSE FORMAT (JSON):
{
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question": "What does this code accomplish?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "medium",
      "concept": "Main concept being tested"
    },
    {
      "id": 2,
      "type": "true-false",
      "question": "This function returns a boolean value.",
      "correct_answer": true,
      "explanation": "Explanation of the statement",
      "difficulty": "easy",
      "concept": "Function return types"
    },
    {
      "id": 3,
      "type": "matching",
      "question": "Match the following concepts with their descriptions:",
      "pairs": [
        {"left": "Variable", "right": "Stores data values"},
        {"left": "Function", "right": "Reusable code block"},
        {"left": "Loop", "right": "Repeats code execution"}
      ],
      "explanation": "These are fundamental programming concepts",
      "difficulty": "medium",
      "concept": "Programming fundamentals"
    }
  ]
}

Generate diverse, educational questions that test understanding of the content provided.
`;
  }

  // Generate explanations for code
  async explainCode(code, language = 'auto-detect') {
    if (!this.isConfigured) {
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert programmer who explains code clearly and concisely. Provide educational explanations suitable for learning.'
          },
          {
            role: 'user',
            content: `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a clear explanation of what it does, how it works, and any important concepts involved.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        success: true,
        explanation: response.choices[0].message.content.trim(),
        metadata: {
          model: response.model,
          usage: response.usage
        }
      };
    } catch (error) {
      console.error('Code explanation failed:', error);
      throw new Error(`Failed to explain code: ${error.message}`);
    }
  }

  // Get API status and configuration info
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      features: {
        quizGeneration: this.isConfigured,
        codeExplanation: this.isConfigured,
        testConnection: this.isConfigured
      }
    };
  }

  // Validate quiz question format
  validateQuizFormat(questions) {
    const errors = [];
    
    if (!Array.isArray(questions)) {
      errors.push('Questions must be an array');
      return errors;
    }

    questions.forEach((question, index) => {
      if (!question.question || typeof question.question !== 'string') {
        errors.push(`Question ${index + 1}: Missing or invalid question text`);
      }
      
      if (!question.type || !['multiple-choice', 'true-false', 'fill-in-the-blank', 'matching'].includes(question.type)) {
        errors.push(`Question ${index + 1}: Invalid question type`);
      }
      
      if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.options) || question.options.length < 2) {
          errors.push(`Question ${index + 1}: Multiple choice questions need at least 2 options`);
        }
        
        if (!question.correct_answer) {
          errors.push(`Question ${index + 1}: Missing correct answer`);
        }
      }
      
      if (question.type === 'true-false') {
        if (typeof question.correct_answer !== 'boolean') {
          errors.push(`Question ${index + 1}: True/false questions need a boolean correct_answer`);
        }
      }
      
      if (question.type === 'matching') {
        if (!Array.isArray(question.pairs) || question.pairs.length < 2) {
          errors.push(`Question ${index + 1}: Matching questions need at least 2 pairs`);
        }
        
        question.pairs?.forEach((pair, pairIndex) => {
          if (!pair.left || !pair.right) {
            errors.push(`Question ${index + 1}, Pair ${pairIndex + 1}: Missing left or right value`);
          }
        });
      }
      
      if (question.type === 'fill-in-the-blank') {
        if (!question.blanks || !Array.isArray(question.blanks)) {
          errors.push(`Question ${index + 1}: Fill-in-the-blank questions need blanks array`);
        }
      }
    });

    return errors;
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;
