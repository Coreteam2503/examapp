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
      model = 'gpt-3.5-turbo', // Use cheaper model for testing
      temperature = 0.7,
      max_tokens = 3000,
      functions = null,
      function_call = null
    } = options;

    console.log('📡 [OpenAIClient] Sending request to OpenAI API...');
    console.log('🔧 [OpenAIClient] Request config:', {
      model,
      messagesCount: messages.length,
      hasFunctions: !!functions,
      hasFunctionCall: !!function_call
    });
    
    const openai = this.initializeOpenAI();
    const startTime = Date.now();
    
    const requestOptions = {
      model,
      messages,
      temperature,
      max_tokens
    };
    
    // Add function calling if provided
    if (functions) {
      requestOptions.functions = functions;
      if (function_call) {
        requestOptions.function_call = function_call;
      }
      console.log('🔧 [OpenAIClient] Function calling enabled with', functions.length, 'functions');
    }
    
    console.log('📤 [OpenAIClient] Final request options:', {
      model: requestOptions.model,
      messagesCount: requestOptions.messages.length,
      hasFunctions: !!requestOptions.functions,
      hasFunctionCall: !!requestOptions.function_call
    });
    
    const response = await openai.chat.completions.create(requestOptions);

    const endTime = Date.now();
    console.log('⏱️ [OpenAIClient] OpenAI API response received in', endTime - startTime, 'ms');
    console.log('📊 [OpenAIClient] API Usage:', response.usage);

    // Handle function call response
    if (response.choices[0].message.function_call) {
      console.log('🔧 [OpenAIClient] Function call response detected');
      return {
        content: response.choices[0].message.function_call.arguments,
        usage: response.usage,
        generationTime: endTime - startTime,
        model: response.model,
        function_call: response.choices[0].message.function_call
      };
    }

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      generationTime: endTime - startTime,
      model: response.model
    };
  }
}

module.exports = OpenAIClient;