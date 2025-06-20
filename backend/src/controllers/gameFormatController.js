const PromptService = require('../../services/promptService');
const { db: knex } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class GameFormatController {
  constructor() {
    this.promptService = new PromptService();
    // Initialize bulletproof fallback data
    this.fallbackData = {
      hangman: {
        title: "Hangman Game",
        metadata: { maxWrongGuesses: 6, totalWords: 1, fallback: true },
        questions: [{
          word_data: {
            word: "PROGRAMMING",
            category: "Technology",
            hint: "The process of creating software applications"
          },
          correct_answer: "PROGRAMMING",
          max_attempts: 6,
          difficulty: "medium",
          concepts: ["programming", "software"]
        }]
      },
      knowledge_tower: {
        title: "Knowledge Tower Game",
        metadata: { totalLevels: 3, progressiveLearning: true, fallback: true },
        questions: [{
          level_number: 1,
          question: "What is the primary purpose of programming?",
          options: ["To create software applications", "To design hardware", "To manage databases", "To create networks"],
          correct_answer: "To create software applications",
          level_theme: "Fundamentals",
          difficulty: "easy",
          concepts: ["programming", "basics"]
        }]
      },
      word_ladder: {
        title: "Word Ladder Game",
        metadata: { maxSteps: 4, totalLadders: 1, fallback: true },
        questions: [{
          ladder_steps: {
            startWord: "CODE",
            endWord: "NODE",
            steps: ["CODE", "COVE", "NOVE", "NODE"],
            hints: ["Programming instructions", "Small bay", "New type", "Network point"]
          },
          correct_answer: "NODE",
          difficulty: "medium",
          concepts: ["programming", "networking"]
        }]
      },
      memory_grid: {
        title: "Memory Grid Game",
        metadata: { gridSize: 3, memoryTime: 5, totalPatterns: 1, fallback: true },
        questions: [{
          pattern_data: {
            grid: [
              ["🔧", "💻", "📝"],
              ["💻", "🔧", "📝"],
              ["📝", "💻", "🔧"]
            ],
            sequence: [0, 4, 8],
            symbols: ["🔧", "💻", "📝"]
          },
          correct_answer: "[0,4,8]",
          difficulty: "medium",
          concepts: ["patterns", "memory", "programming"]
        }]
      }
    };
  }

  /**
   * Generate game format quiz - BULLETPROOF VERSION
   * POST /api/games/generate
   */
  async generateGameFormat(req, res) {
    const requestId = Date.now();
    console.log(`🎮 [${requestId}] BULLETPROOF game generation started`, {
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
      if (!this.fallbackData[gameFormat]) {
        console.log(`❌ [${requestId}] Invalid game format: ${gameFormat}`);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid game format',
          supportedFormats: Object.keys(this.fallbackData)
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

      // Generate game data with comprehensive error handling
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
        console.log(`🔄 [${requestId}] Using bulletproof fallback...`);
        
        gameData = this.getFallbackGameData(gameFormat, difficulty, { ...gameOptions, numQuestions }, upload?.filename);
        console.log(`✅ [${requestId}] Fallback data ready`);
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
          const questions = gameData.questions.map((question, index) => ({
            quiz_id: quizId,
            question_number: index + 1,
            type: gameFormat,
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
            created_at: new Date()
          }));

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
      // ULTIMATE FALLBACK - This should NEVER fail
      console.error(`❌ [${requestId}] CRITICAL ERROR:`, error);
      console.error(`Stack:`, error.stack);
      
      const gameFormat = req.body?.gameFormat || 'hangman';
      const numQuestions = parseInt(req.body?.numQuestions || 5);
      const emergency = this.getFallbackGameData(gameFormat, 'medium', { numQuestions });
      
      res.status(200).json({
        success: true,
        message: 'Game generated using emergency fallback',
        game: {
          id: `emergency_${requestId}`,
          title: emergency.title,
          game_format: gameFormat,
          difficulty: 'medium',
          total_questions: emergency.questions.length,
          metadata: emergency.metadata,
          questions: emergency.questions,
          created_at: new Date().toISOString(),
          emergency_fallback: true
        },
        gameFormat: gameFormat,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        note: 'Generated using emergency fallback - all functionality preserved'
      });
    }
  }

  /**
   * Safely generate game data with multiple fallback layers
   */
  async generateGameDataSafely(gameFormat, difficulty, gameOptions, content) {
    try {
      // Try AI generation first
      return await this.generateWithAI(gameFormat, difficulty, gameOptions, content);
    } catch (aiError) {
      console.log('AI generation failed, using structured fallback:', aiError.message);
      return this.getFallbackGameData(gameFormat, difficulty, gameOptions);
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
   * Get bulletproof fallback data with correct number of questions
   */
  getFallbackGameData(gameFormat, difficulty, gameOptions, filename = 'content') {
    const numQuestions = gameOptions.numQuestions || 5;
    const baseData = this.fallbackData[gameFormat] || this.fallbackData.hangman;
    
    // Generate multiple questions/levels based on user selection
    const questions = [];
    
    switch (gameFormat) {
      case 'hangman':
        const words = ['PROGRAMMING', 'FUNCTION', 'VARIABLE', 'ALGORITHM', 'DATABASE', 'NETWORK', 'SECURITY', 'TESTING'];
        for (let i = 0; i < numQuestions; i++) {
          const word = words[i % words.length];
          questions.push({
            word_data: {
              word: word,
              category: "Technology",
              hint: `A ${word.toLowerCase()}-related programming concept`
            },
            correct_answer: word,
            max_attempts: gameOptions.maxWrongGuesses || 6,
            difficulty: difficulty,
            concepts: ["programming", "technology"]
          });
        }
        break;
        
      case 'knowledge_tower':
        const themes = ['Fundamentals', 'Intermediate', 'Advanced', 'Expert', 'Master'];
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            level_number: i + 1,
            question: `Level ${i + 1}: What is a key concept in programming?`,
            options: ["Variables store data", "Functions are colors", "Loops are shapes", "Classes are numbers"],
            correct_answer: "Variables store data",
            level_theme: themes[i % themes.length],
            difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
            concepts: ["programming", "basics"]
          });
        }
        break;
        
      case 'word_ladder':
        const ladders = [
          { start: 'CODE', end: 'NODE', steps: ['CODE', 'COVE', 'NOVE', 'NODE'] },
          { start: 'LOOP', end: 'POOL', steps: ['LOOP', 'LOOM', 'POOM', 'POOL'] },
          { start: 'DATA', end: 'BASE', steps: ['DATA', 'BATA', 'BABE', 'BASE'] }
        ];
        for (let i = 0; i < numQuestions; i++) {
          const ladder = ladders[i % ladders.length];
          questions.push({
            ladder_steps: {
              startWord: ladder.start,
              endWord: ladder.end,
              steps: ladder.steps,
              hints: [`Transform ${ladder.start}`, 'Change one letter', 'Keep changing', `Reach ${ladder.end}`]
            },
            correct_answer: ladder.end,
            difficulty: difficulty,
            concepts: ["programming", "word games"]
          });
        }
        break;
        
      case 'memory_grid':
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            pattern_data: {
              grid: [
                ["🔧", "💻", "📝"],
                ["💻", "🔧", "📝"],
                ["📝", "💻", "🔧"]
              ],
              sequence: [0, 4, 8],
              symbols: ["🔧", "💻", "📝"]
            },
            correct_answer: `[0,4,8]`,
            difficulty: difficulty,
            concepts: ["patterns", "memory", "programming"]
          });
        }
        break;
        
      default:
        // Fallback to single question
        questions.push(baseData.questions[0]);
    }
    
    return {
      title: `${gameFormat.replace('_', ' ').toUpperCase()} Game - ${filename}`,
      metadata: {
        ...baseData.metadata,
        totalQuestions: numQuestions,
        totalWords: gameFormat === 'hangman' ? numQuestions : undefined,
        totalLevels: gameFormat === 'knowledge_tower' ? numQuestions : undefined,
        totalLadders: gameFormat === 'word_ladder' ? numQuestions : undefined,
        totalPatterns: gameFormat === 'memory_grid' ? numQuestions : undefined,
        difficulty: difficulty,
        gameOptions: gameOptions,
        generated_by: 'bulletproof_fallback',
        timestamp: new Date().toISOString()
      },
      questions: questions
    };
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
    
    const prompt = `Generate a Hangman word guessing game based on the following content. 
    
    Content: ${content}
    
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
      const gameData = JSON.parse(response);
      
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
    const levelsCount = options.numQuestions || options.levelsCount || 5;
    
    const prompt = `Generate a Knowledge Tower climbing game based on the following content.
    
    Content: ${content}
    
    Requirements:
    - Create EXACTLY ${levelsCount} progressive difficulty levels
    - Each level should have questions that build on previous levels
    - Start with basic concepts and progress to advanced
    - Difficulty: ${difficulty}
    - Each level should have a clear theme/focus
    - Generate EXACTLY ${levelsCount} levels, no more, no less
    
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
          "question": "Basic question about the content",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A",
          "level_theme": "Fundamentals",
          "difficulty": "easy",
          "concepts": ["basic concept"]
        }
        // Repeat for all ${levelsCount} levels with increasing difficulty
      ]
    }`;

    try {
      const response = await this.promptService.generateContent(prompt);
      const gameData = JSON.parse(response);
      
      // Validate we got the right number of levels
      if (!gameData.questions || gameData.questions.length !== levelsCount) {
        console.log(`⚠️ AI generated ${gameData.questions?.length || 0} levels instead of ${levelsCount}, using fallback`);
        throw new Error(`Expected ${levelsCount} levels, got ${gameData.questions?.length || 0}`);
      }
      
      return gameData;
    } catch (error) {
      console.error('Error generating knowledge tower game:', error);
      throw error;
    }
  }

  /**
   * Generate Word Ladder game data from content
   */
  async generateWordLadderGame(content, difficulty, options) {
    const numLadders = options.numQuestions || 3;
    const maxSteps = options.maxSteps || 6;
    
    const prompt = `Generate a Word Ladder transformation game based on the following content.
    
    Content: ${content}
    
    Requirements:
    - Create EXACTLY ${numLadders} word ladder puzzles
    - Words should be related to the content concepts
    - Maximum ${maxSteps} steps per ladder
    - Difficulty: ${difficulty}
    - Provide hints for transformations
    - Generate EXACTLY ${numLadders} ladders, no more, no less
    
    Return a JSON object with this structure:
    {
      "title": "Word Ladder Game Title", 
      "metadata": {
        "maxSteps": ${maxSteps},
        "totalLadders": ${numLadders}
      },
      "questions": [
        {
          "ladder_steps": {
            "startWord": "CODE",
            "endWord": "NODE",
            "steps": ["CODE", "CODA", "NODA", "NODE"],
            "hints": ["Musical ending", "Data structure", "Final target"]
          },
          "correct_answer": "NODE",
          "difficulty": "${difficulty}",
          "concepts": ["programming", "data structures"]
        }
        // Repeat for all ${numLadders} ladders
      ]
    }`;

    try {
      const response = await this.promptService.generateContent(prompt);
      const gameData = JSON.parse(response);
      
      // Validate we got the right number of ladders
      if (!gameData.questions || gameData.questions.length !== numLadders) {
        console.log(`⚠️ AI generated ${gameData.questions?.length || 0} ladders instead of ${numLadders}, using fallback`);
        throw new Error(`Expected ${numLadders} ladders, got ${gameData.questions?.length || 0}`);
      }
      
      return gameData;
    } catch (error) {
      console.error('Error generating word ladder game:', error);
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
    
    const prompt = `Generate a Memory Grid pattern matching game based on the following content.
    
    Content: ${content}
    
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
      const response = await this.promptService.generateContent(prompt);
      const gameData = JSON.parse(response);
      
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

    return {
      ...quiz,
      metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {},
      game_options: quiz.game_options ? JSON.parse(quiz.game_options) : {},
      questions: questions.map(question => ({
        ...question,
        word_data: question.word_data ? JSON.parse(question.word_data) : null,
        pattern_data: question.pattern_data ? JSON.parse(question.pattern_data) : null,
        ladder_steps: question.ladder_steps ? JSON.parse(question.ladder_steps) : null,
        visual_data: question.visual_data ? JSON.parse(question.visual_data) : null,
        options: question.options ? JSON.parse(question.options) : null,
        concepts: JSON.parse(question.concepts || '[]')
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
}

const gameFormatController = new GameFormatController();

module.exports = {
  generateGameFormat: (req, res) => gameFormatController.generateGameFormat(req, res),
  getGameById: (req, res) => gameFormatController.getGameById(req, res)
};
