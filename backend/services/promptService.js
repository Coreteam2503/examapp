/**
 * PromptService - Main service class that orchestrates quiz generation
 * Uses other components for specific responsibilities
 */
const OpenAIClient = require('./prompt/OpenAIClient');
const QuizPromptBuilder = require('./prompt/QuizPromptBuilder');
const QuizResponseParser = require('./prompt/QuizResponseParser');
const FallbackQuizGenerator = require('./prompt/FallbackQuizGenerator');

class PromptService {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.promptBuilder = new QuizPromptBuilder();
    this.responseParser = new QuizResponseParser();
    this.fallbackGenerator = new FallbackQuizGenerator();
    
    console.log('🔧 [PromptService] PromptService initialized with all components');
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

    console.log('🚀 [PromptService] Starting quiz generation from content...');
    console.log('📝 [PromptService] Generation parameters:', {
      difficulty,
      numQuestions,
      questionTypes,
      language,
      contentLength: content?.length || 0,
      useOpenAI: this.openaiClient.isAvailable()
    });

    // Use fallback if OpenAI is not available
    if (!this.openaiClient.isAvailable()) {
      console.log('🔄 [PromptService] Generating quiz using fallback generator...');
      return this.fallbackGenerator.generateQuizFromContent(content, {
        difficulty,
        numQuestions,
        questionTypes,
        language
      });
    }

    console.log('🔨 [PromptService] Building quiz generation prompt...');
    const prompt = this.promptBuilder.buildQuizGenerationPrompt(content, {
      difficulty,
      numQuestions,
      questionTypes,
      language
    });
    console.log('📏 [PromptService] Prompt built, length:', prompt.length, 'characters');

    try {
      const messages = [
        {
          role: 'system',
          content: this.promptBuilder.getSystemPrompt()
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openaiClient.generateContent(messages, {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 3000
      });

      const rawResponse = response.content;
      console.log('📄 [PromptService] Raw response length:', rawResponse.length, 'characters');
      console.log('📋 [PromptService] Raw response preview:', rawResponse.substring(0, 200) + '...');

      console.log('🔍 [PromptService] Parsing OpenAI response...');
      const result = this.responseParser.parseQuizResponse(rawResponse);
      
      console.log('✅ [PromptService] Quiz generation completed successfully');
      console.log('📊 [PromptService] Generated result:', {
        questionsCount: result.questions?.length || 0,
        hasMetadata: !!result.metadata,
        questionTypes: result.questions?.map(q => q.type) || []
      });

      // Add generation metadata
      result.metadata = {
        ...result.metadata,
        generationTime: response.generationTime,
        apiUsage: response.usage,
        model: response.model,
        generatedBy: 'openai'
      };

      return result;

    } catch (error) {
      console.error('❌ [PromptService] Error generating quiz with OpenAI:', error);
      console.error('🔍 [PromptService] Error details:', {
        message: error.message,
        type: error.constructor.name
      });
      console.log('🔄 [PromptService] Falling back to pattern-based generator...');
      
      return this.fallbackGenerator.generateQuizFromContent(content, {
        difficulty,
        numQuestions,
        questionTypes,
        language
      });
    }
  }

  /**
   * Generate content using the appropriate LLM service
   * @param {string} prompt - The prompt to send to the LLM
   * @returns {Promise<string>} The generated content
   */
  async generateContent(prompt) {
    console.log('🚀 [PromptService] Starting content generation...');
    console.log('📝 [PromptService] Prompt length:', prompt.length, 'characters');
    console.log('🔑 [PromptService] Using OpenAI:', this.openaiClient.isAvailable() ? 'Yes' : 'No');

    // Use fallback if OpenAI is not available
    if (!this.openaiClient.isAvailable()) {
      return this.fallbackGenerator.generateContent(prompt);
    }

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that generates educational content. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openaiClient.generateContent(messages, {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('✅ [PromptService] Content generation completed successfully');
      return response.content;

    } catch (error) {
      console.error('❌ [PromptService] Error generating content with OpenAI:', error);
      console.log('🔄 [PromptService] Falling back to simple content generation...');
      
      return this.fallbackGenerator.generateContent(prompt);
    }
  }

  /**
   * Generate questions for specific difficulty levels
   */
  async generateByDifficulty(content, difficulty) {
    console.log('🚀 [PromptService] Starting difficulty-based generation...');
    console.log('📝 [PromptService] Difficulty level:', difficulty);

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
    console.log('🎯 [PromptService] Using settings:', settings);

    const result = await this.generateQuizFromContent(content, { difficulty, ...settings });
    console.log('✅ [PromptService] Difficulty-based generation completed');
    return result;
  }
}

module.exports = PromptService;