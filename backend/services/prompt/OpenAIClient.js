/**
 * OpenAI Client - Handles OpenAI API initialization and basic operations
 */
const { OpenAI } = require('openai');

class OpenAIClient {
  constructor() {
    this.openai = null;
    this.useOpenAI = !!process.env.OPENAI_API_KEY;
    
    console.log('🔧 [OpenAIClient] Initializing OpenAI client...');
    console.log('🔑 [OpenAIClient] OpenAI API Key present:', this.useOpenAI ? 'Yes' : 'No');
    
    if (!this.useOpenAI) {
      console.log('⚠️ [OpenAIClient] OpenAI API key not found.');
      console.log('💡 [OpenAIClient] For better quiz quality, please set OPENAI_API_KEY in your .env file.');
    } else {
      console.log('✅ [OpenAIClient] OpenAI API configured successfully');
    }
  }

  /**
   * Initialize OpenAI client (lazy initialization)
   */
  initializeOpenAI() {
    console.log('🔧 [OpenAIClient] Initializing OpenAI client...');
    
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ [OpenAIClient] OPENAI_API_KEY environment variable is not set');
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ [OpenAIClient] OpenAI client initialized successfully');
    }
    return this.openai;
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable() {
    return this.useOpenAI;
  }

  /**
   * Generate content using OpenAI
   */
  async generateContent(messages, options = {}) {
    if (!this.useOpenAI) {
      throw new Error('OpenAI not available');
    }

    const {
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 3000
    } = options;

    console.log('📡 [OpenAIClient] Sending request to OpenAI API...');
    const openai = this.initializeOpenAI();
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    const endTime = Date.now();
    console.log('⏱️ [OpenAIClient] OpenAI API response received in', endTime - startTime, 'ms');
    console.log('📊 [OpenAIClient] API Usage:', response.usage);

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      generationTime: endTime - startTime,
      model: response.model
    };
  }
}

module.exports = OpenAIClient;