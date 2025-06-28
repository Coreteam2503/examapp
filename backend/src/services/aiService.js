const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔧 [AIService] Initializing AI Service...');
    console.log('🔑 [AIService] API Key present:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      console.warn('⚠️ [AIService] OpenAI API key not found. AI features will be disabled.');
      console.warn('⚠️ [AIService] Please set OPENAI_API_KEY in your environment variables.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.isConfigured = true;
      console.log('✅ [AIService] OpenAI API client initialized successfully');
    } catch (error) {
      console.error('❌ [AIService] Failed to initialize OpenAI client:', error.message);
      this.isConfigured = false;
    }
  }

  // Test API connectivity
  async testConnection() {
    console.log('🧪 [AIService] Testing OpenAI API connection...');
    
    if (!this.isConfigured) {
      console.error('❌ [AIService] Cannot test connection - OpenAI API is not configured');
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    try {
      console.log('📡 [AIService] Sending test request to OpenAI API...');
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

      console.log('✅ [AIService] OpenAI API test successful');
      console.log('📊 [AIService] Test response usage:', response.usage);

      return {
        success: true,
        message: 'OpenAI API connection successful',
        response: response.choices[0].message.content.trim(),
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      console.error('❌ [AIService] OpenAI API test failed:', error);
      return {
        success: false,
        message: 'OpenAI API connection failed',
        error: error.message
      };
    }
  }

  // Generate quiz questions from content
  async generateQuizQuestions(content, options = {}) {
    const {
      numQuestions = 5,
      difficulty = 'medium',
      questionTypes = ['multiple-choice'],
      language = 'auto-detect'
    } = options;

    console.log('🚀 [AIService] Starting quiz generation...');
    console.log('📝 [AIService] Quiz parameters:', {
      numQuestions,
      difficulty,
      questionTypes,
      language,
      contentLength: content.length
    });

    if (!this.isConfigured) {
      console.error('❌ [AIService] Cannot generate quiz - OpenAI API is not configured');
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    try {
      console.log('🔨 [AIService] Building quiz prompt...');
      const prompt = this.buildQuizPrompt(content, {
        numQuestions,
        difficulty,
        questionTypes,
        language
      });
      console.log('📏 [AIService] Prompt length:', prompt.length, 'characters');

      console.log('📡 [AIService] Sending request to OpenAI API...');
      const startTime = Date.now();
      
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

      const endTime = Date.now();
      console.log('⏱️ [AIService] OpenAI API response time:', endTime - startTime, 'ms');
      console.log('📊 [AIService] API Usage:', response.usage);

      console.log('🔍 [AIService] Parsing OpenAI response...');
      console.log('📄 [AIService] Raw response length:', response.choices[0].message.content.length, 'characters');
      console.log('📋 [AIService] Raw response preview:', response.choices[0].message.content.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(response.choices[0].message.content);
        console.log('✅ [AIService] Successfully parsed JSON response');
        console.log('📊 [AIService] Generated questions count:', result.questions?.length || 0);
      } catch (parseError) {
        console.error('❌ [AIService] Failed to parse JSON response:', parseError.message);
        console.error('🔍 [AIService] Raw response content:', response.choices[0].message.content);
        throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
      }

      // Validate the result structure
      if (!result.questions || !Array.isArray(result.questions)) {
        console.error('❌ [AIService] Invalid response structure - missing questions array');
        throw new Error('Invalid response structure: missing questions array');
      }

      console.log('✅ [AIService] Quiz generation completed successfully');
      console.log('📈 [AIService] Final result:', {
        questionsGenerated: result.questions.length,
        hasMetadata: !!result.metadata,
        questionTypes: result.questions.map(q => q.type)
      });
      
      return {
        success: true,
        questions: result.questions,
        metadata: {
          model: response.model,
          usage: response.usage,
          difficulty: difficulty,
          language: language,
          contentLength: content.length,
          generationTime: endTime - startTime,
          ...result.metadata
        }
      };
    } catch (error) {
      console.error('❌ [AIService] Quiz generation failed:', error);
      console.error('🔍 [AIService] Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  // Build the prompt for quiz generation
  buildQuizPrompt(content, options) {
    const { numQuestions, difficulty, questionTypes, language } = options;
    
    console.log('🔨 [AIService] Building prompt with options:', { numQuestions, difficulty, questionTypes, language });
    
    const questionTypeInstructions = {
      'multiple-choice': 'Multiple choice questions with 4 options (A, B, C, D)',
      'true-false': 'True or false questions about the content',
      'fill-in-the-blank': 'Fill-in-the-blank questions with missing keywords or values',
      'matching': 'Matching questions with pairs of related concepts'
    };
    
    const instructions = questionTypes.map(type => questionTypeInstructions[type] || type).join(', ');
    
    const prompt = `
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

    console.log('✅ [AIService] Prompt built successfully');
    return prompt;
  }

  // Generate explanations for code
  async explainCode(code, language = 'auto-detect') {
    console.log('🚀 [AIService] Starting code explanation...');
    console.log('📝 [AIService] Code explanation parameters:', { language, codeLength: code.length });

    if (!this.isConfigured) {
      console.error('❌ [AIService] Cannot explain code - OpenAI API is not configured');
      throw new Error('OpenAI API is not configured. Please check your API key.');
    }

    try {
      console.log('📡 [AIService] Sending code explanation request to OpenAI...');
      const startTime = Date.now();

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

      const endTime = Date.now();
      console.log('⏱️ [AIService] Code explanation response time:', endTime - startTime, 'ms');
      console.log('📊 [AIService] API Usage:', response.usage);
      console.log('✅ [AIService] Code explanation completed successfully');

      return {
        success: true,
        explanation: response.choices[0].message.content.trim(),
        metadata: {
          model: response.model,
          usage: response.usage,
          generationTime: endTime - startTime
        }
      };
    } catch (error) {
      console.error('❌ [AIService] Code explanation failed:', error);
      throw new Error(`Failed to explain code: ${error.message}`);
    }
  }

  // Get API status and configuration info
  getStatus() {
    const status = {
      configured: this.isConfigured,
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      features: {
        quizGeneration: this.isConfigured,
        codeExplanation: this.isConfigured,
        testConnection: this.isConfigured
      }
    };

    console.log('📊 [AIService] Current status:', status);
    return status;
  }

  // Validate quiz question format
  validateQuizFormat(questions) {
    console.log('🔍 [AIService] Validating quiz format...');
    console.log('📊 [AIService] Questions to validate:', questions?.length || 0);
    
    const errors = [];
    
    if (!Array.isArray(questions)) {
      const error = 'Questions must be an array';
      console.error('❌ [AIService] Validation error:', error);
      errors.push(error);
      return errors;
    }

    questions.forEach((question, index) => {
      console.log(`🔍 [AIService] Validating question ${index + 1}:`, {
        type: question.type,
        hasQuestion: !!question.question,
        hasCorrectAnswer: question.correct_answer !== undefined
      });

      if (!question.question || typeof question.question !== 'string') {
        const error = `Question ${index + 1}: Missing or invalid question text`;
        console.error('❌ [AIService] Validation error:', error);
        errors.push(error);
      }
      
      if (!question.type || !['multiple-choice', 'true-false', 'fill-in-the-blank', 'matching'].includes(question.type)) {
        const error = `Question ${index + 1}: Invalid question type`;
        console.error('❌ [AIService] Validation error:', error);
        errors.push(error);
      }
      
      if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.options) || question.options.length < 2) {
          const error = `Question ${index + 1}: Multiple choice questions need at least 2 options`;
          console.error('❌ [AIService] Validation error:', error);
          errors.push(error);
        }
        
        if (!question.correct_answer) {
          const error = `Question ${index + 1}: Missing correct answer`;
          console.error('❌ [AIService] Validation error:', error);
          errors.push(error);
        }
      }
      
      if (question.type === 'true-false') {
        if (typeof question.correct_answer !== 'boolean') {
          const error = `Question ${index + 1}: True/false questions need a boolean correct_answer`;
          console.error('❌ [AIService] Validation error:', error);
          errors.push(error);
        }
      }
      
      if (question.type === 'matching') {
        if (!Array.isArray(question.pairs) || question.pairs.length < 2) {
          const error = `Question ${index + 1}: Matching questions need at least 2 pairs`;
          console.error('❌ [AIService] Validation error:', error);
          errors.push(error);
        }
        
        question.pairs?.forEach((pair, pairIndex) => {
          if (!pair.left || !pair.right) {
            const error = `Question ${index + 1}, Pair ${pairIndex + 1}: Missing left or right value`;
            console.error('❌ [AIService] Validation error:', error);
            errors.push(error);
          }
        });
      }
      
      if (question.type === 'fill-in-the-blank') {
        if (!question.blanks || !Array.isArray(question.blanks)) {
          const error = `Question ${index + 1}: Fill-in-the-blank questions need blanks array`;
          console.error('❌ [AIService] Validation error:', error);
          errors.push(error);
        }
      }
    });

    if (errors.length === 0) {
      console.log('✅ [AIService] Quiz validation completed successfully');
    } else {
      console.error('❌ [AIService] Quiz validation failed with', errors.length, 'errors');
    }

    return errors;
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;