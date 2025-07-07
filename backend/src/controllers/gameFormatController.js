const PromptService = require('../../services/promptService');
const { db: knex } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const { extractJupyterCells } = require('../../utils/jupyterUtils');

class GameFormatController {
  constructor() {
    this.promptService = new PromptService();
    console.log('🎮 [GameFormatController] Initialized with AI-only generation (no fallbacks)');
  }

  /**
   * Generate game format quiz - AI-POWERED VERSION
   * POST /api/games/generate
   */
  async generateGameFormat(req, res) {
    const requestId = Date.now();
    console.log(`🎮 [${requestId}] AI-powered game generation started`, {
      body: req.body,
      user: req.user?.userId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Extract and validate input with safe defaults
      const uploadId = req.body?.uploadId || null;
      const gameFormat = req.body?.gameFormat || 'hangman';
      const difficulty = req.body?.difficulty || 'medium';
      const gameOptions = req.body?.gameOptions || {};
      const numQuestions = parseInt(req.body?.numQuestions || gameOptions?.numQuestions || gameOptions?.levelsCount || 5);
      const userId = req.user?.userId || 1;

      console.log(`📝 [${requestId}] Processing:`, { uploadId, gameFormat, difficulty, gameOptions, userId, numQuestions });

      // Validate game format
      const supportedFormats = ['hangman', 'knowledge_tower', 'word_ladder', 'memory_grid'];
      if (!supportedFormats.includes(gameFormat)) {
        console.log(`❌ [${requestId}] Invalid game format: ${gameFormat}`);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid game format',
          supportedFormats: supportedFormats
        });
      }

      // Get upload information (with comprehensive fallback)
      let upload = null;
      let content = 'function example() { console.log("Hello World"); return "programming"; }';
      
      if (uploadId) {
        try {
          console.log(`🔍 [${requestId}] Looking up upload...`);
          upload = await knex('uploads')
            .where({ id: uploadId, user_id: userId })
            .first();

          if (upload) {
            console.log(`✅ [${requestId}] Upload found:`, {
              id: upload.id,
              filename: upload.filename,
              hasContent: !!upload.content,
              hasPath: !!upload.file_path
            });

            // Read file content with fallback
            if (upload.content) {
              content = upload.content;
              console.log(`📄 [${requestId}] Using stored content, length:`, content.length);
            } else if (upload.file_path) {
              try {
                const filePath = path.join(__dirname, '../../uploads', upload.file_path);
                console.log(`📂 [${requestId}] Reading file from path:`, filePath);
                content = await fs.readFile(filePath, 'utf8');
                console.log(`✅ [${requestId}] File read successfully, length:`, content.length);
              } catch (fileError) {
                console.log(`⚠️ [${requestId}] File read failed, using default:`, fileError.message);
              }
            }
          } else {
            console.log(`⚠️ [${requestId}] Upload not found, using default content`);
          }
        } catch (dbError) {
          console.log(`⚠️ [${requestId}] Database lookup failed:`, dbError.message);
        }
      } else {
        console.log(`📄 [${requestId}] No uploadId provided, using default content for demo`);
      }

      if (!content || content.trim().length === 0) {
        console.log(`⚠️ [${requestId}] Content is empty, using default`);
        content = 'function example() { console.log("Hello World"); return "programming"; }';
      }

      // Generate game data with error handling
      let gameData;
      try {
        console.log(`🧠 [${requestId}] Generating game data with AI service...`);
        gameData = await this.generateGameDataSafely(gameFormat, difficulty, { ...gameOptions, numQuestions }, content);
        console.log(`✅ [${requestId}] Game data generated:`, {
          title: gameData.title,
          questionCount: gameData.questions?.length,
          hasMetadata: !!gameData.metadata
        });
      } catch (gameGenError) {
        console.error(`❌ [${requestId}] Game generation error:`, gameGenError);
        // Return proper error response instead of fallback
        return res.status(500).json({
          success: false,
          error: 'Game generation failed',
          message: gameGenError.message,
          requestId: requestId,
          timestamp: new Date().toISOString()
        });
      }

      // Store in database with error handling
      let quizId = null;
      try {
        console.log(`💾 [${requestId}] Storing game in database...`);
        [quizId] = await knex('quizzes').insert({
          upload_id: uploadId,
          user_id: userId,
          created_by: userId,
          title: gameData.title || `${gameFormat.replace('_', ' ').toUpperCase()} Game`,
          difficulty: difficulty,
          total_questions: gameData.questions ? gameData.questions.length : numQuestions,
          game_format: gameFormat,
          game_options: JSON.stringify({ ...gameOptions, numQuestions }),
          created_at: new Date(),
          metadata: JSON.stringify(gameData.metadata || {})
        });
        
        console.log(`✅ [${requestId}] Quiz record created with ID:`, quizId);

        // Store game questions/data
        if (gameData.questions && gameData.questions.length > 0) {
          console.log(`💾 [${requestId}] Storing`, gameData.questions.length, 'questions...');
          const questions = gameData.questions.map((question, index) => {
            // Debug MCQ questions
            if (question.type === 'mcq') {
              console.log(`🔍 [${requestId}] MCQ question ${index + 1}:`, {
                hasOptions: !!question.options,
                options: question.options,
                correctAnswer: question.correct_answer,
                optionsCount: question.options?.length || 0
              });
            }
            
            // Debug matching questions
            if (question.type === 'matching') {
              console.log(`🔍 [${requestId}] Matching question ${index + 1}:`, {
                hasLeftItems: !!question.leftItems,
                hasRightItems: !!question.rightItems,
                hasCorrectPairs: !!question.correctPairs,
                leftItems: question.leftItems,
                rightItems: question.rightItems,
                correctPairs: question.correctPairs
              });
            }
            
            return {
              quiz_id: quizId,
              question_number: index + 1,
              type: question.type || gameFormat, // Use question-specific type, fallback to game format
              question_text: question.question || question.prompt || '',
              correct_answer: question.correct_answer || '',
              word_data: question.word_data ? JSON.stringify(question.word_data) : null,
              level_number: question.level_number || (index + 1),
              pattern_data: question.pattern_data ? JSON.stringify(question.pattern_data) : null,
              ladder_steps: question.ladder_steps ? JSON.stringify(question.ladder_steps) : null,
              max_attempts: question.max_attempts || gameOptions.maxWrongGuesses || 6,
              visual_data: question.visual_data ? JSON.stringify(question.visual_data) : null,
              difficulty: question.difficulty || difficulty,
              concepts: JSON.stringify(question.concepts || []),
              hint: question.hint || null,
              level_theme: question.level_theme || `Level ${index + 1}`,
              options: question.options ? JSON.stringify(question.options) : null,
              // Add support for matching question fields
              items: question.leftItems ? JSON.stringify({
                left: question.leftItems,
                right: question.rightItems,
                correctPairs: question.correctPairs
              }) : null,
              created_at: new Date()
            };
          });

          await knex('questions').insert(questions);
          console.log(`✅ [${requestId}] Questions stored successfully`);
        }
      } catch (dbError) {
        console.error(`⚠️ [${requestId}] Database storage failed:`, dbError);
        console.log(`🔄 [${requestId}] Continuing with temporary ID...`);
        quizId = `temp_${requestId}`;
      }

      // Prepare final response
      const response = {
        success: true,
        message: `${gameFormat.replace('_', ' ')} game generated successfully`,
        game: {
          id: quizId,
          title: gameData.title,
          game_format: gameFormat,
          difficulty: difficulty,
          total_questions: gameData.questions ? gameData.questions.length : numQuestions,
          metadata: gameData.metadata,
          questions: gameData.questions,
          created_at: new Date().toISOString(),
          upload_filename: upload ? upload.filename : 'default_content.txt'
        },
        gameFormat: gameFormat,
        timestamp: new Date().toISOString(),
        requestId: requestId
      };

      console.log(`🎉 [${requestId}] Game generation completed successfully`);
      res.status(201).json(response);

    } catch (error) {
      // Return proper error response
      console.error(`❌ [${requestId}] CRITICAL ERROR:`, error);
      console.error(`Stack:`, error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Critical game generation failure',
        message: error.message,
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Safely generate game data with error handling
   */
  async generateGameDataSafely(gameFormat, difficulty, gameOptions, content) {
    try {
      // Try AI generation
      return await this.generateWithAI(gameFormat, difficulty, gameOptions, content);
    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError.message);
      // Re-throw the error instead of using fallback
      throw new Error(`AI generation failed: ${aiError.message}`);
    }
  }

  /**
   * Generate with AI (existing methods)
   */
  async generateWithAI(gameFormat, difficulty, gameOptions, content) {
    switch (gameFormat) {
      case 'hangman':
        return await this.generateHangmanGame(content, difficulty, gameOptions);
      case 'knowledge_tower':
        return await this.generateKnowledgeTowerGame(content, difficulty, gameOptions);
      case 'word_ladder':
        return await this.generateWordLadderGame(content, difficulty, gameOptions);
      case 'memory_grid':
        return await this.generateMemoryGridGame(content, difficulty, gameOptions);
      default:
        throw new Error(`Unsupported game format: ${gameFormat}`);
    }
  }

  /**
   * Generate Hangman game data from content
   */
  async generateHangmanGame(content, difficulty, options) {
    const numWords = options.numQuestions || 5;
    console.log('🎯 Starting Hangman game generation:', {
      contentLength: content.length,
      difficulty,
      options,
      numWords
    });
    
    const maxWrongGuesses = options.maxWrongGuesses || 6;
    
    // Truncate content if too large to avoid token limits
    const maxContentLength = 8000;
    let processedContent = content;
    if (content.length > maxContentLength) {
      console.log(`⚠️ Content too large (${content.length} chars), truncating to ${maxContentLength} chars for Hangman game`);
      processedContent = content.substring(0, maxContentLength) + '\n\n[Content truncated for processing...]';
    }
    
    const prompt = `Generate a Hangman word guessing game based on the following content. 
    
    Content: ${processedContent}
    
    Requirements:
    - Extract exactly ${numWords} important words or phrases from the content
    - Words should be relevant to the main concepts
    - Difficulty: ${difficulty}
    - Provide hints for each word
    - Words should be 4-15 characters long
    - Generate EXACTLY ${numWords} words, no more, no less
    
    Return a JSON object with this structure:
    {
      "title": "Hangman Game Title",
      "metadata": {
        "maxWrongGuesses": ${maxWrongGuesses},
        "totalWords": ${numWords}
      },
      "questions": [
        {
          "word_data": {
            "word": "EXAMPLE",
            "category": "Programming Concept",
            "hint": "A sample or instance used for illustration"
          },
          "correct_answer": "EXAMPLE",
          "max_attempts": ${maxWrongGuesses},
          "difficulty": "${difficulty}",
          "concepts": ["programming", "examples"]
        }
        // Repeat for all ${numWords} words
      ]
    }`;

    try {
      console.log('🤖 Calling AI service for Hangman generation...');
      const response = await this.promptService.generateContent(prompt);
      console.log('✅ AI service response received, parsing JSON...');
      
      // Handle new response structure
      const content = typeof response === 'object' ? response.content : response;
      console.log('📄 Raw LLM response length:', content.length, 'characters');
      console.log('📋 Raw LLM response preview:', content.substring(0, 500) + '...');
      
      const gameData = JSON.parse(content);
      console.log('🔍 Parsed game data structure:', {
        title: gameData.title,
        questionsCount: gameData.questions?.length || 0,
        firstQuestionSample: gameData.questions?.[0] ? {
          hasWordData: !!gameData.questions[0].word_data,
          word: gameData.questions[0].word_data?.word,
          hint: gameData.questions[0].word_data?.hint
        } : 'No questions'
      });
      
      // Validate we got the right number of questions
      if (!gameData.questions || gameData.questions.length !== numWords) {
        console.log(`⚠️ AI generated ${gameData.questions?.length || 0} words instead of ${numWords}, using fallback`);
        throw new Error(`Expected ${numWords} words, got ${gameData.questions?.length || 0}`);
      }
      
      console.log('✅ Hangman game data parsed successfully:', {
        title: gameData.title,
        questionCount: gameData.questions?.length
      });
      return gameData;
    } catch (error) {
      console.error('❌ Error generating hangman game with AI:', error);
      throw error; // Let the upper layer handle fallback
    }
  }

  /**
   * Generate Knowledge Tower game data from content
   */
  async generateKnowledgeTowerGame(content, difficulty, options) {
    console.log('🏗️ [KnowledgeTower] Starting generation with:', {
      contentLength: content?.length,
      difficulty,
      options,
      hasPromptService: !!this.promptService
    });
    
    const levelsCount = options.numQuestions || options.levelsCount || 5;
    
    // Handle Jupyter notebooks intelligently
    let processedContent = content;
    if (content.includes('"cells":') && content.includes('"cell_type":')) {
      console.log('📓 [KnowledgeTower] Detected Jupyter notebook, extracting key cells...');
      try {
        const extraction = extractJupyterCells(content);
        processedContent = extraction.content;
        console.log('✅ [KnowledgeTower] Extracted', extraction.metadata.extractedCells, 'cells from', extraction.originalCellCount, 'total cells');
      } catch (error) {
        console.log('⚠️ [KnowledgeTower] Jupyter extraction failed, using truncation:', error.message);
        processedContent = content.substring(0, 6000) + '\n\n[Content truncated...]';
      }
    } else {
      // Regular content truncation for non-notebook files
      const maxContentLength = 6000;
      if (content.length > maxContentLength) {
        console.log(`⚠️ [KnowledgeTower] Content too large (${content.length} chars), truncating to ${maxContentLength} chars`);
        processedContent = content.substring(0, maxContentLength) + '\n\n[Content truncated for processing...]';
      }
    }
    
    const prompt = `Generate a Knowledge Tower climbing game based on the following content.
    
    Content: ${processedContent}
    
    Requirements:
    - Create EXACTLY ${levelsCount} progressive difficulty levels
    - Each level should have questions that build on previous levels
    - Start with basic concepts and progress to advanced
    - Difficulty: ${difficulty}
    - Each level should have a clear theme/focus
    - Generate EXACTLY ${levelsCount} levels, no more, no less
    - Use ONLY these question types: mcq, true_false
    - DO NOT use matching questions
    - Mix only mcq and true_false across levels
    
    Question Type Guidelines:
    - mcq: Multiple choice with 4 options (A, B, C, D)
    - true_false: Boolean questions (true/false)
    
    STRICTLY FORBIDDEN: Do not generate "matching" type questions under any circumstances.
    
    CRITICAL OUTPUT FORMAT:
    - For MCQ questions: options must be ["A) Option text", "B) Option text", "C) Option text", "D) Option text"]
    - For MCQ questions: correct_answer must be single letter "A", "B", "C", or "D"
    - For true_false questions: correct_answer must be boolean true or false (not string)
    
    Return a JSON object with this structure:
    {
      "title": "Knowledge Tower Game Title",
      "metadata": {
        "totalLevels": ${levelsCount},
        "progressiveLeaming": true
      },
      "questions": [
        {
          "level_number": 1,
          "type": "mcq",
          "question": "Basic question about the content",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correct_answer": "A",
          "explanation": "Detailed explanation of the correct answer",
          "level_theme": "Fundamentals",
          "difficulty": "easy",
          "concepts": ["basic concept"]
        },
        {
          "level_number": 2,
          "type": "true_false",
          "question": "True or false question about content",
          "correct_answer": true,
          "explanation": "Explanation of why this is true/false",
          "level_theme": "Understanding",
          "difficulty": "easy",
          "concepts": ["concept"]
        }
    
    MANDATORY FORMAT RULES:
    - MCQ options MUST include letters: ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"]
    - MCQ correct_answer MUST be just the letter: "A", "B", "C", or "D"
    - True/false correct_answer MUST be boolean: true or false
    
    Generate ONLY mcq and true_false question types. Do NOT generate matching questions.
      ]
    }`;

    // Define function schema for structured Knowledge Tower generation
    const knowledgeTowerFunction = {
      name: "generate_knowledge_tower",
      description: "Generate a Knowledge Tower game with structured question data",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the Knowledge Tower game"
          },
          metadata: {
            type: "object",
            properties: {
              totalLevels: { type: "number" },
              progressiveLearning: { type: "boolean" }
            }
          },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                level_number: { type: "number" },
                type: { 
                  type: "string", 
                  enum: ["mcq", "true_false", "matching"]
                },
                question: { type: "string" },
                options: {
                  type: "array",
                  items: { 
                    type: "string",
                    pattern: "^[A-D]\\) .+"
                  },
                  minItems: 4,
                  maxItems: 4,
                  description: "REQUIRED for MCQ. MUST be exactly 4 items in format: ['A) Option text', 'B) Option text', 'C) Option text', 'D) Option text']"
                },
                correct_answer: { 
                  type: ["string", "boolean"],
                  description: "For MCQ: MUST be exactly one letter A, B, C, or D. For true_false: MUST be boolean true/false"
                },
                leftItems: {
                  type: "array",
                  items: { type: "string" },
                  description: "Required for matching questions - items to match"
                },
                rightItems: {
                  type: "array", 
                  items: { type: "string" },
                  description: "Required for matching questions - descriptions/matches"
                },
                correctPairs: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "number" }
                  },
                  description: "Required for matching questions - [[leftIndex, rightIndex], ...]"
                },
                explanation: { type: "string" },
                level_theme: { type: "string" },
                difficulty: { type: "string" },
                concepts: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["level_number", "type", "question", "level_theme", "difficulty", "concepts"]
            }
          }
        },
        required: ["title", "metadata", "questions"]
      }
    };

    try {
      console.log('🚀 [KnowledgeTower] Using function calling for structured generation...');
      const response = await this.promptService.generateContent([
        {
          role: 'system',
          content: 'You are an educational game generator. You MUST follow the exact format requirements for MCQ options. MCQ options MUST include letter prefixes like "A) Option text". This is critical for the frontend to work properly.'
        },
        {
          role: 'user',
          content: `Generate a Knowledge Tower climbing game with exactly ${levelsCount} levels based on this content:

${processedContent}

YOU MUST FOLLOW THESE EXACT FORMAT REQUIREMENTS:

For MCQ questions:
- options MUST be exactly: ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"]
- correct_answer MUST be exactly: "A" or "B" or "C" or "D"

For true_false questions:
- correct_answer MUST be exactly: true or false (boolean)

EXAMPLE MCQ:
{
  "type": "mcq",
  "question": "What is 2+2?",
  "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
  "correct_answer": "B"
}

EXAMPLE TRUE/FALSE:
{
  "type": "true_false", 
  "question": "The sky is blue",
  "correct_answer": true
}

Requirements:
- Create exactly ${levelsCount} progressive difficulty levels
- Use question types: mcq, true_false (NO matching)
- Each level should build on previous concepts
- Difficulty: ${difficulty}

DO NOT FORGET THE LETTER PREFIXES (A), B), C), D)) IN OPTIONS!`
        }
      ], {
        functions: [knowledgeTowerFunction],
        function_call: { name: "generate_knowledge_tower" }
      });
      console.log('📄 [KnowledgeTower] Got LLM response');
      
      // Parse function call response
      let gameData;
      if (response.function_call) {
        console.log('🔧 [KnowledgeTower] Processing function call response');
        gameData = JSON.parse(response.content);
      } else {
        console.log('📝 [KnowledgeTower] Processing regular response');
        // If we get a regular response object, extract content
        const content = typeof response === 'object' ? response.content : response;
        gameData = JSON.parse(content);
      }
      
      // Fix MCQ format issues automatically
      if (gameData.questions) {
        gameData.questions = gameData.questions.map((question, index) => {
          if (question.type === 'mcq' && question.options) {
            console.log(`🔧 [KnowledgeTower] Fixing MCQ format for question ${index + 1}`);
            
            // Check if options already have letter prefixes
            const hasLetterPrefixes = question.options.every(opt => /^[A-D]\)/.test(opt));
            
            let fixedOptions;
            let fixedCorrectAnswer;
            
            if (hasLetterPrefixes) {
              // Options already have letters, just use them as-is
              fixedOptions = question.options;
              fixedCorrectAnswer = question.correct_answer;
            } else {
              // Add letter prefixes to options
              fixedOptions = question.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D
                return `${letter}) ${option}`;
              });
              
              // Find which option matches the correct answer and convert to letter
              const correctIndex = question.options.findIndex(option => 
                option.toString().trim() === question.correct_answer.toString().trim()
              );
              
              if (correctIndex !== -1) {
                fixedCorrectAnswer = String.fromCharCode(65 + correctIndex); // A, B, C, D
              } else {
                // Fallback: if we can't match, try partial matching
                const partialMatch = question.options.findIndex(option => 
                  option.toString().toLowerCase().includes(question.correct_answer.toString().toLowerCase()) ||
                  question.correct_answer.toString().toLowerCase().includes(option.toString().toLowerCase())
                );
                fixedCorrectAnswer = partialMatch !== -1 ? String.fromCharCode(65 + partialMatch) : 'A';
              }
            }
            
            console.log(`✅ [KnowledgeTower] Fixed MCQ - Options: ${JSON.stringify(fixedOptions.slice(0, 2))}..., Answer: ${fixedCorrectAnswer}`);
            
            return {
              ...question,
              options: fixedOptions,
              correct_answer: fixedCorrectAnswer
            };
          }
          
          return question;
        });
      }
      
      // Validate we got the right number of levels
      if (!gameData.questions || gameData.questions.length !== levelsCount) {
        console.log(`⚠️ Knowledge Tower: AI generated ${gameData.questions?.length || 0} levels instead of ${levelsCount}`);
        throw new Error(`Expected ${levelsCount} levels, got ${gameData.questions?.length || 0}`);
      }
      
      console.log('✅ [KnowledgeTower] Successfully generated:', {
        title: gameData.title,
        questionCount: gameData.questions.length,
        questionTypes: gameData.questions.map(q => q.type)
      });
      
      return gameData;
    } catch (error) {
      console.error('❌ Knowledge Tower generation error:', {
        message: error.message,
        stack: error.stack,
        promptServiceAvailable: !!this.promptService
      });
      throw error;
    }
  }

  /**
   * Generate Word Ladder game data from content
   */
  async generateWordLadderGame(content, difficulty, options) {
    const numQuestions = options.numQuestions || 3;
    
    // Truncate content if too large to avoid token limits
    const maxContentLength = 8000;
    let processedContent = content;
    if (content.length > maxContentLength) {
      console.log(`⚠️ Content too large (${content.length} chars), truncating to ${maxContentLength} chars for Word Ladder game`);
      processedContent = content.substring(0, maxContentLength) + '\n\n[Content truncated for processing...]';
    }
    
    const prompt = `Generate code analysis questions for a "Word Ladder" style game based on the following content.

Content: ${processedContent}

Requirements:
- Create EXACTLY ${numQuestions} code-based multiple choice questions
- Questions should analyze, explain, or test understanding of the content
- Difficulty: ${difficulty}
- Focus on code comprehension, not syntax memorization
- Questions can be about: functionality, output, concepts, debugging, optimization, etc.
- Be creative with question types but keep them code-focused
- Provide 4 multiple choice options for each question

Examples of good question types (but be creative and varied):
- "What does this function accomplish?"
- "What will be the output of this code?"
- "Which concept is demonstrated in this example?"
- "What happens when you run this code snippet?"
- "What is the purpose of this parameter?"
- "Which approach would be more efficient?"

Return a JSON object with this structure:
{
  "title": "Code Analysis - Word Ladder Game",
  "metadata": {
    "totalQuestions": ${numQuestions},
    "gameType": "code_analysis",
    "difficulty": "${difficulty}"
  },
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What does this function accomplish?",
      "code_snippet": "def example():\n    return value",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Detailed explanation of the correct answer",
      "difficulty": "${difficulty}",
      "concepts": ["relevant", "concepts"],
      "question_type": "functionality"
    }
    // Repeat for all ${numQuestions} questions
  ]
}

Generate diverse, creative questions that test different aspects of understanding the content:`;

    try {
      console.log('🚀 [WordLadder] Sending prompt to LLM for code analysis questions...');
      const response = await this.promptService.generateContent(prompt);
      console.log('📄 [WordLadder] Received LLM response, parsing...');
      
      // Handle new response structure
      const content = typeof response === 'object' ? response.content : response;
      const gameData = JSON.parse(content);
      
      // Validate we got the right number of questions
      if (!gameData.questions || gameData.questions.length !== numQuestions) {
        console.log(`⚠️ [WordLadder] AI generated ${gameData.questions?.length || 0} questions instead of ${numQuestions}, using fallback`);
        throw new Error(`Expected ${numQuestions} questions, got ${gameData.questions?.length || 0}`);
      }
      
      // Transform questions to word ladder format expected by database
      const transformedQuestions = gameData.questions.map((question, index) => ({
        ...question,
        ladder_steps: {
          type: 'code_analysis',
          question: question.question,
          code_snippet: question.code_snippet || null,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          question_type: question.question_type || 'analysis',
          concepts: question.concepts || []
        }
      }));
      
      console.log('✅ [WordLadder] Successfully generated and transformed code analysis questions');
      return {
        ...gameData,
        questions: transformedQuestions
      };
      
    } catch (error) {
      console.error('❌ [WordLadder] Error generating word ladder game:', error);
      console.log('🔄 [WordLadder] Using fallback code analysis questions...');
      throw error;
    }
  }

  /**
   * Generate Memory Grid game data from content
   */
  async generateMemoryGridGame(content, difficulty, options) {
    const numPatterns = options.numQuestions || 3;
    const gridSize = options.gridSize || 4;
    const memoryTime = options.memoryTime || 5;
    
    // Truncate content if too large to avoid token limits
    const maxContentLength = 8000;
    let processedContent = content;
    if (content.length > maxContentLength) {
      console.log(`⚠️ Content too large (${content.length} chars), truncating to ${maxContentLength} chars for Memory Grid game`);
      processedContent = content.substring(0, maxContentLength) + '\n\n[Content truncated for processing...]';
    }
    
    const prompt = `Generate a Memory Grid pattern matching game based on the following content.
    
    Content: ${processedContent}
    
    Requirements:
    - Create EXACTLY ${numPatterns} different ${gridSize}x${gridSize} grid patterns with symbols/concepts from the content
    - Memory time: ${memoryTime} seconds
    - Difficulty: ${difficulty}
    - Patterns should represent key concepts from the content
    - Generate EXACTLY ${numPatterns} patterns, no more, no less
    
    Return a JSON object with this structure:
    {
      "title": "Memory Grid Game Title",
      "metadata": {
        "gridSize": ${gridSize},
        "memoryTime": ${memoryTime},
        "totalPatterns": ${numPatterns}
      },
      "questions": [
        {
          "pattern_data": {
            "grid": [
              ["🔧", "💻", "🔧", "📝"],
              ["📝", "🔧", "💻", "🔧"],
              ["💻", "📝", "🔧", "💻"],
              ["🔧", "💻", "📝", "🔧"]
            ],
            "sequence": [0, 5, 10, 15],
            "symbols": ["🔧", "💻", "📝"]
          },
          "correct_answer": "[0,5,10,15]",
          "difficulty": "${difficulty}",
          "concepts": ["patterns", "memory"]
        }
        // Repeat for all ${numPatterns} patterns
      ]
    }`;

    try {
      console.log('🤖 Calling AI service for Memory Grid generation...');
      const response = await this.promptService.generateContent(prompt);
      console.log('✅ AI service response received, parsing JSON...');
      
      // Handle new response structure
      const content = typeof response === 'object' ? response.content : response;
      console.log('📄 Raw LLM response length:', content.length, 'characters');
      console.log('📋 Raw LLM response preview:', content.substring(0, 500) + '...');
      
      const gameData = JSON.parse(content);
      console.log('🔍 Parsed Memory Grid data structure:', {
        title: gameData.title,
        questionsCount: gameData.questions?.length || 0,
        firstPatternSample: gameData.questions?.[0] ? {
          hasPatternData: !!gameData.questions[0].pattern_data,
          gridSize: gameData.questions[0].pattern_data?.grid?.length || 0,
          symbolsCount: gameData.questions[0].pattern_data?.symbols?.length || 0
        } : 'No questions'
      });
      
      // Validate we got the right number of patterns
      if (!gameData.questions || gameData.questions.length !== numPatterns) {
        console.log(`⚠️ AI generated ${gameData.questions?.length || 0} patterns instead of ${numPatterns}, using fallback`);
        throw new Error(`Expected ${numPatterns} patterns, got ${gameData.questions?.length || 0}`);
      }
      
      return gameData;
    } catch (error) {
      console.error('Error generating memory grid game:', error);
      throw error;
    }
  }

  /**
   * Generate simple fallback when no questions are available
   */
  getFallbackGameData(gameFormat, difficulty = 'medium', options = {}) {
    console.log(`🔄 [getFallbackGameData] No questions available for ${gameFormat}`);
    
    return {
      title: `${gameFormat} Game - No Questions Available`,
      questions: [],
      metadata: {
        is_fallback: true,
        game_format: gameFormat,
        message: 'No questions available. Please add questions to the question bank.',
        generated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Get complete game data with questions
   */
  async getCompleteGameData(quizId, userId = null) {
    const quizQuery = knex('quizzes')
      .select([
        'quizzes.*',
        'uploads.filename',
        'uploads.file_type'
      ])
      .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
      .where('quizzes.id', quizId);

    if (userId) {
      quizQuery.where('quizzes.user_id', userId);
    }

    const quiz = await quizQuery.first();

    if (!quiz) {
      return null;
    }

    // Get questions/game data for this quiz
    const questions = await knex('questions')
      .where('quiz_id', quizId)
      .orderBy('question_number');

    console.log(`🎮 [getCompleteGameData] Quiz ${quizId} - Format: ${quiz.game_format}, Questions count: ${questions.length}`);
    
    // Handle missing questions for game formats with bulletproof fallback
    let processedQuestions = questions;
    
    if ((!questions || questions.length === 0) && quiz.game_format && quiz.game_format !== 'traditional') {
      console.log(`⚠️ [getCompleteGameData] No questions found for game ${quiz.game_format}, generating fallback`);
      const gameOptions = quiz.game_options ? JSON.parse(quiz.game_options) : {};
      const numQuestions = parseInt(gameOptions.numQuestions || quiz.total_questions || 5);
      const fallbackData = this.getFallbackGameData(quiz.game_format, quiz.difficulty || 'medium', { numQuestions });
      processedQuestions = fallbackData.questions.map((question, index) => ({
        id: `fallback_${index}`,
        quiz_id: quizId,
        question_number: index + 1,
        type: quiz.game_format,
        question_text: question.question || question.prompt || '',
        correct_answer: question.correct_answer || '',
        word_data: question.word_data ? JSON.stringify(question.word_data) : null,
        level_number: question.level_number || (index + 1),
        pattern_data: question.pattern_data ? JSON.stringify(question.pattern_data) : null,
        ladder_steps: question.ladder_steps ? JSON.stringify(question.ladder_steps) : null,
        max_attempts: question.max_attempts || 6,
        visual_data: question.visual_data ? JSON.stringify(question.visual_data) : null,
        difficulty: question.difficulty || quiz.difficulty || 'medium',
        concepts: JSON.stringify(question.concepts || []),
        hint: question.hint || null,
        level_theme: question.level_theme || `Level ${index + 1}`,
        options: question.options ? JSON.stringify(question.options) : null,
        created_at: new Date(),
        fallback_generated: true
      }));
      
      console.log(`✅ [getCompleteGameData] Generated ${processedQuestions.length} fallback questions`);
    }

    return {
      ...quiz,
      metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {},
      game_options: quiz.game_options ? JSON.parse(quiz.game_options) : {},
      questions: processedQuestions.map(question => ({
        ...question,
        word_data: this._parseTextField(question.word_data),
        pattern_data: this._parseTextField(question.pattern_data),
        ladder_steps: this._parseTextField(question.ladder_steps),
        visual_data: this._parseTextField(question.visual_data),
        options: this._parseOptionsField(question.options),
        concepts: this._parseConceptsField(question.concepts)
      }))
    };
  }

  /**
   * Get game by ID
   * GET /api/games/:id
   */
  async getGameById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const game = await this.getCompleteGameData(id, userId);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json(game);

    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({ error: 'Failed to fetch game' });
    }
  }

  /**
   * Safely parse options field - handles both JSON and plain text formats
   */
  _parseOptionsField(options) {
    if (!options) return null;
    
    // If it's already an object/array, return as is
    if (typeof options !== 'string') return options;
    
    // Try to parse as JSON first (for older questions)
    try {
      return JSON.parse(options);
    } catch (e) {
      // If JSON parsing fails, return as plain text string (new format)
      return options;
    }
  }

  /**
   * Safely parse concepts field - should always be valid JSON array
   */
  _parseConceptsField(concepts) {
    if (!concepts) return [];
    
    if (typeof concepts !== 'string') return concepts;
    
    try {
      return JSON.parse(concepts);
    } catch (e) {
      // If parsing fails, return empty array
      return [];
    }
  }

  /**
   * Safely parse text fields that might be comma-separated or JSON
   */
  _parseTextField(field) {
    if (!field) return null;
    
    if (typeof field !== 'string') return field;
    
    // Try JSON parsing first
    try {
      return JSON.parse(field);
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      return field;
    }
  }
}

const gameFormatController = new GameFormatController();

module.exports = {
  generateGameFormat: (req, res) => gameFormatController.generateGameFormat(req, res),
  getGameById: (req, res) => gameFormatController.getGameById(req, res)
};
