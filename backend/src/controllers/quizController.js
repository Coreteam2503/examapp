const PromptService = require('../../services/promptService');
const { QuizGenerationService, QuizGenerationError } = require('../services/quizGenerationService');
const { db: knex } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const { safeJsonParse, safeCommaParse } = require('../utils/jsonUtils');

class QuizController {
  constructor() {
    this.promptService = new PromptService();
    this.quizGenerationService = new QuizGenerationService();
  }

  /**
   * Generate enhanced quiz with specific question types
   * POST /api/quizzes/generate-enhanced
   */
  async generateEnhancedQuiz(req, res) {
    console.log('🔥 [QuizController] generateEnhancedQuiz endpoint called!');
    try {
      const { 
        uploadId, 
        difficulty = 'medium', 
        numQuestions = 5, 
        questionTypes = ['multiple_choice'],
        includeHints = false
      } = req.body;
      const userId = req.user.userId;

      console.log('🚀 [QuizController] Starting enhanced quiz generation...');
      console.log('📝 [QuizController] Request parameters:', {
        uploadId,
        difficulty,
        numQuestions,
        questionTypes,
        includeHints,
        userId
      });

      if (!uploadId) {
        console.error('❌ [QuizController] Upload ID is required');
        return res.status(400).json({ error: 'Upload ID is required' });
      }

      // Get upload information
      console.log('🔍 [QuizController] Fetching upload information...');
      const upload = await knex('uploads')
        .where({ id: uploadId, user_id: userId })
        .first();

      if (!upload) {
        console.error('❌ [QuizController] Upload not found for user', userId, 'uploadId', uploadId);
        return res.status(404).json({ error: 'Upload not found' });
      }

      console.log('✅ [QuizController] Upload found:', {
        filename: upload.filename,
        fileType: upload.file_type,
        hasContent: !!upload.content,
        hasFilePath: !!upload.file_path
      });

      // Read file content
      console.log('📖 [QuizController] Reading file content...');
      let content;
      if (upload.content) {
        console.log('📄 [QuizController] Using content from database');
        content = upload.content;
      } else if (upload.file_path) {
        console.log('📁 [QuizController] Reading content from file path:', upload.file_path);
        const filePath = path.join(__dirname, '../../uploads', upload.file_path);
        try {
          content = await fs.readFile(filePath, 'utf8');
          console.log('✅ [QuizController] File content read successfully, length:', content.length);
        } catch (fileError) {
          console.error('❌ [QuizController] Error reading file:', fileError);
          return res.status(500).json({ error: 'Could not read uploaded file' });
        }
      } else {
        console.error('❌ [QuizController] No content source available');
        return res.status(400).json({ error: 'No content available for this upload' });
      }

      if (!content || content.trim().length === 0) {
        console.error('❌ [QuizController] Upload content is empty');
        return res.status(400).json({ error: 'Upload content is empty' });
      }

      console.log('📊 [QuizController] Content ready for processing:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });

      // Generate quiz using LLM with enhanced options
      console.log('🎯 [QuizController] Starting LLM quiz generation...');
      console.log('📝 [QuizController] LLM parameters:', {
        difficulty,
        numQuestions: parseInt(numQuestions),
        questionTypes,
        language: this.detectLanguage(upload.filename),
        includeHints
      });
      
      const quizData = await this.promptService.generateQuizFromContent(content, {
        difficulty,
        numQuestions: parseInt(numQuestions),
        questionTypes,
        language: this.detectLanguage(upload.filename),
        includeHints
      });

      console.log('✅ [QuizController] LLM quiz generation completed successfully');
      console.log('📊 [QuizController] Generated quiz data:', {
        questionsCount: quizData.questions?.length || 0,
        hasMetadata: !!quizData.metadata,
        questionTypes: quizData.questions?.map(q => q.type) || []
      });

      // Store quiz in database with enhanced title
      console.log('💾 [QuizController] Storing quiz in database...');
      const [quizId] = await knex('quizzes').insert({
        upload_id: uploadId,
        user_id: userId,
        created_by: userId,
        title: quizData.metadata?.title || `Enhanced Quiz for ${upload.filename}`,
        difficulty: difficulty,
        total_questions: quizData.questions.length,
        created_at: new Date(),
        metadata: JSON.stringify({
          ...quizData.metadata,
          questionTypes,
          includeHints,
          enhanced: true
        })
      });

      console.log('✅ [QuizController] Quiz stored with ID:', quizId);

      // Store questions with enhanced data
      console.log('💾 [QuizController] Storing questions in database...');
      const questions = quizData.questions.map((question, index) => {
        const normalizedType = this.normalizeQuestionType(question.type);
        
        console.log(`📝 [QuizController] Processing question ${index + 1}:`, {
          id: question.id,
          type: question.type,
          normalizedType,
          hasOptions: !!question.options,
          hasCorrectAnswer: question.correct_answer !== undefined,
          hasExplanation: !!question.explanation
        });
        
        return {
          quiz_id: quizId,
          question_number: index + 1,
          type: normalizedType,
          question_text: question.question,
          code_snippet: question.code_snippet || null,
          options: question.options ? JSON.stringify(question.options) : null,
          correct_answer: question.correct_answer || null,
          correct_answers_data: question.correctAnswers ? JSON.stringify(question.correctAnswers) : null,
          explanation: question.explanation,
          difficulty: question.difficulty || difficulty,
          concepts: JSON.stringify(question.concepts || []),
          hint: question.hint || null,
          formatted_text: question.text || question.question,
          created_at: new Date()
        };
      });

      console.log('💾 [QuizController] Inserting', questions.length, 'questions into database...');
      await knex('questions').insert(questions);
      console.log('✅ [QuizController] All questions inserted successfully');

      // Get the complete quiz data to return
      console.log('🔍 [QuizController] Fetching complete quiz data...');
      const completeQuiz = await this.getCompleteQuizData(quizId);
      console.log('✅ [QuizController] Complete quiz data retrieved');

      console.log('🎉 [QuizController] Enhanced quiz generation completed successfully');
      res.status(201).json({
        message: 'Enhanced quiz generated successfully',
        quiz: completeQuiz,
        questionTypes: questionTypes,
        features: {
          fillInTheBlank: questionTypes.includes('fill_in_the_blank'),
          hints: includeHints,
          enhanced: true
        }
      });

    } catch (error) {
      console.error('❌ [QuizController] Error generating enhanced quiz:', error);
      console.error('🔍 [QuizController] Error details:', {
        message: error.message,
        stack: error.stack,
        uploadId,
        userId
      });
      res.status(500).json({ 
        error: 'Failed to generate enhanced quiz',
        details: error.message 
      });
    }
  }

  /**
   * Generate dynamic quiz from question bank
   * POST /api/quizzes/generate-dynamic
   */
  async generateDynamicQuiz(req, res) {
    try {
      console.log('🎯 [QuizController] Dynamic quiz generation started');
      console.log('📝 [QuizController] Request body:', req.body);
      
      const userId = req.user.userId;
      
      // Generate quiz using the service
      const result = await this.quizGenerationService.generateQuiz(req.body, userId);
      
      console.log(`✅ [QuizController] Dynamic quiz generated successfully, ID: ${result.quiz.id}`);
      
      res.status(201).json({
        success: true,
        message: 'Dynamic quiz generated successfully',
        data: result
      });
      
    } catch (error) {
      console.error('❌ [QuizController] Dynamic quiz generation failed:', error);
      
      if (error instanceof QuizGenerationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          details: error.details
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during quiz generation',
        error: error.message
      });
    }
  }

  /**
   * Get available options for quiz generation
   * GET /api/quizzes/generation-options
   */
  async getGenerationOptions(req, res) {
    try {
      console.log('📊 [QuizController] Getting generation options');
      
      const options = await this.quizGenerationService.getAvailableOptions();
      
      console.log('✅ [QuizController] Generation options retrieved:', {
        domains: options.domains.length,
        subjects: options.subjects.length,
        types: options.types.length
      });
      
      res.json({
        success: true,
        data: options
      });
      
    } catch (error) {
      console.error('❌ [QuizController] Get generation options failed:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching generation options',
        error: error.message
      });
    }
  }

  async generateQuiz(req, res) {
    console.log('🔥 [QuizController] generateQuiz endpoint called!');
    try {
      const { uploadId, difficulty = 'medium', numQuestions = 5 } = req.body;
      const userId = req.user.userId;

      if (!uploadId) {
        return res.status(400).json({ error: 'Upload ID is required' });
      }

      // Get upload information
      const upload = await knex('uploads')
        .where({ id: uploadId, user_id: userId })
        .first();

      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      // Read file content
      let content;
      if (upload.content) {
        content = upload.content;
        console.log(`Content loaded from DB: ${content.length} chars`);
      } else if (upload.file_path) {
        const filePath = path.join(__dirname, '../../uploads', upload.file_path);
        try {
          content = await fs.readFile(filePath, 'utf8');
          console.log(`Content loaded from file: ${content.length} chars`);
        } catch (fileError) {
          console.error('Error reading file:', fileError);
          return res.status(500).json({ error: 'Could not read uploaded file' });
        }
      } else {
        return res.status(400).json({ error: 'No content available for this upload' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Upload content is empty' });
      }

      // Generate quiz using LLM
      console.log(`🎯 Generating quiz for upload ${uploadId}: ${numQuestions} questions, ${difficulty} difficulty`);
      console.log(`📝 Content preview: ${content.substring(0, 100)}...`);
      
      const questionTypes = ['multiple-choice', 'true-false', 'fill-in-the-blank'];
      
      console.log(`🚀 Calling promptService.generateQuizFromContent...`);
      const quizData = await this.promptService.generateQuizFromContent(content, {
        difficulty,
        numQuestions: parseInt(numQuestions),
        questionTypes,
        language: this.detectLanguage(upload.filename)
      });
      
      console.log(`✅ LLM response received:`, {
        questionsCount: quizData.questions?.length || 0,
        hasMetadata: !!quizData.metadata,
        questionSample: quizData.questions?.[0] ? {
          type: quizData.questions[0].type,
          hasQuestion: !!quizData.questions[0].question,
          hasAnswer: !!quizData.questions[0].correct_answer,
          questionPreview: quizData.questions[0].question?.substring(0, 50) + '...',
          answerPreview: quizData.questions[0].correct_answer?.toString().substring(0, 30) + '...'
        } : 'No questions'
      });
      
      // DETAILED LLM RESPONSE INSPECTION
      if (quizData.questions && quizData.questions.length > 0) {
        console.log(`🔍 Raw LLM Question Structure:`, {
          firstQuestion: JSON.stringify(quizData.questions[0], null, 2)
        });
      }

      // Store quiz in database
      console.log(`💾 Saving quiz to database...`);
      const [quizId] = await knex('quizzes').insert({
        upload_id: uploadId,
        user_id: userId,
        created_by: userId,
        title: quizData.metadata?.title || `Quiz for ${upload.filename}`,
        difficulty: difficulty,
        total_questions: quizData.questions.length,
        created_at: new Date(),
        metadata: JSON.stringify(quizData.metadata || {})
      });
      console.log(`✅ Quiz saved with ID: ${quizId}`);

      // Store questions
      console.log(`💾 Saving ${quizData.questions.length} questions...`);
      const questions = quizData.questions.map((question, index) => {
        const normalizedType = this.normalizeQuestionType(question.type);
        
        console.log(`📝 Question ${index + 1}: ${question.question?.substring(0, 50)}... (${normalizedType})`);
        
        const questionData = {
          quiz_id: quizId,
          question_number: index + 1,
          type: normalizedType,
          question_text: question.question,
          code_snippet: question.code_snippet || null,
          options: question.options ? JSON.stringify(question.options) : null,
          correct_answer: question.correct_answer || null,
          correct_answers_data: question.correctAnswers ? JSON.stringify(question.correctAnswers) : null,
          pairs: question.pairs ? JSON.stringify(question.pairs) : null,
          items: question.items ? JSON.stringify(question.items) : null,
          correct_order: question.correctOrder ? JSON.stringify(question.correctOrder) : null,
          explanation: question.explanation,
          difficulty: question.difficulty || difficulty,
          concepts: JSON.stringify(question.concepts || []),
          hint: question.hint || null,
          formatted_text: question.text || question.question,
          created_at: new Date()
        };
        
        console.log(`    → Saved: ${!!questionData.question_text}, Answer: ${!!questionData.correct_answer}, Options: ${!!questionData.options}`);
        return questionData;
      });

      await knex('questions').insert(questions);
      console.log(`✅ All questions saved successfully`);
      
      // VERIFICATION: Check if quiz-question associations were actually saved
      console.log(`🔍 Verifying saved quiz-question associations...`);
      const savedAssociations = await knex('quiz_questions')
        .join('questions', 'quiz_questions.question_id', 'questions.id')
        .where('quiz_questions.quiz_id', quizId)
        .select('questions.*', 'quiz_questions.question_number')
        .orderBy('quiz_questions.question_number');
        
      console.log(`📊 Verification results:`, {
        expectedCount: questions.length,
        actualCount: savedAssociations.length,
        sampleQuestion: savedAssociations[0] ? {
          id: savedAssociations[0].id,
          type: savedAssociations[0].type,
          question_text: savedAssociations[0].question_text?.substring(0, 50) + '...',
          hasCorrectAnswer: !!savedQuestions[0].correct_answer,
          hasOptions: !!savedQuestions[0].options,
          hasExplanation: !!savedQuestions[0].explanation
        } : 'No questions found'
      });

      // Get the complete quiz data to return
      const completeQuiz = await this.getCompleteQuizData(quizId);

      res.status(201).json({
        message: 'Quiz generated successfully',
        quiz: completeQuiz
      });

    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      console.error('   Error details:', error.message);
      res.status(500).json({ 
        error: 'Failed to generate quiz',
        details: error.message 
      });
    }
  }

  /**
   * Get all quizzes for current user with batch-aware filtering
   * GET /api/quizzes
   */
  async getUserQuizzes(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let quizzesQuery = knex('quizzes')
        .select([
          'quizzes.*',
          'uploads.filename',
          'uploads.file_type'
        ])
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id');

      let countQuery = knex('quizzes');

      // Apply filtering based on user role
      if (userRole === 'admin') {
        // Admins can see all quizzes
        quizzesQuery = quizzesQuery.orderBy('quizzes.created_at', 'desc');
        // countQuery remains unchanged for admins
      } else {
        // Students can only see quizzes from their accessible batches
        const User = require('../models/User');
        const userBatches = await User.getActiveBatches(userId);
        const userBatchIds = userBatches.map(batch => batch.id);
        
        if (userBatchIds.length > 0) {
          // Filter quizzes that have questions in user's batches
          quizzesQuery = quizzesQuery
            .whereExists(function() {
              this.select('*')
                .from('quiz_questions')
                .join('question_batches', 'quiz_questions.question_id', 'question_batches.question_id')
                .whereRaw('quiz_questions.quiz_id = quizzes.id')
                .whereIn('question_batches.batch_id', userBatchIds);
            })
            .orderBy('quizzes.created_at', 'desc');
            
          countQuery = countQuery
            .whereExists(function() {
              this.select('*')
                .from('quiz_questions')
                .join('question_batches', 'quiz_questions.question_id', 'question_batches.question_id')
                .whereRaw('quiz_questions.quiz_id = quizzes.id')
                .whereIn('question_batches.batch_id', userBatchIds);
            });
        } else {
          // User has no active batches, return empty result
          return res.json({
            quizzes: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: "0",
              totalPages: 0
            }
          });
        }
      }

      const quizzes = await quizzesQuery
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCount = await countQuery.count('id as count').first();

      // Log for debugging
      console.log(`📋 Fetched quizzes for ${userRole} user ${userId}:`, quizzes.map(q => ({
        id: q.id, 
        title: q.title, 
        game_format: q.game_format,
        total_questions: q.total_questions
      })));

      res.json({
        quizzes: quizzes.map(quiz => ({
          ...quiz,
          metadata: safeJsonParse(quiz.metadata, {}),
          // Ensure game_format is included and properly formatted
          game_format: quiz.game_format || 'traditional',
          is_game: quiz.game_format && quiz.game_format !== 'traditional'
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching user quizzes:', error);
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  }

  /**
   * Get specific quiz by ID with questions
   * GET /api/quizzes/:id
   */
  async getQuizById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // For admins, get quiz without user restriction
      // For students, check batch access but don't restrict by user_id
      let quiz;
      if (userRole === 'admin') {
        quiz = await this.getCompleteQuizData(id);
      } else {
        // For students, get quiz without user restriction
        // but check batch access later if needed
        quiz = await this.getCompleteQuizData(id);
        
        // Additional batch access control could be added here if needed
        // but for now, allow access to all quizzes since they appear in the list
      }

      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // For game formats with missing questions, redirect to game controller
      if (quiz.game_format && quiz.game_format !== 'traditional' && (!quiz.questions || quiz.questions.length === 0)) {
        console.log(`🎮 [getQuizById] Game format ${quiz.game_format} with no questions, using game controller`);
        try {
          const { getGameById } = require('./gameFormatController');
          // Create a mock request/response to use the game controller
          const gameReq = { params: { id }, user: { userId } };
          const gameRes = {
            json: (data) => {
              console.log(`✅ [getQuizById] Retrieved game data with ${data.questions?.length || 0} questions`);
              return res.json(data);
            },
            status: (code) => ({ json: (data) => res.status(code).json(data) })
          };
          return await getGameById(gameReq, gameRes);
        } catch (gameError) {
          console.error('Error using game controller:', gameError);
          // Continue with original quiz data
        }
      }

      res.json(quiz);

    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ error: 'Failed to fetch quiz' });
    }
  }

  /**
   * Delete quiz
   * DELETE /api/quizzes/:id
   */
  async deleteQuiz(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Verify quiz ownership
      const quiz = await knex('quizzes')
        .where({ id, user_id: userId })
        .first();

      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Delete related data (questions, attempts, answers) in transaction
      await knex.transaction(async (trx) => {
        // Delete answers for this quiz
        await trx('answers')
          .whereIn('attempt_id', function() {
            this.select('id').from('attempts').where('quiz_id', id);
          })
          .del();

        // Delete attempts
        await trx('attempts').where('quiz_id', id).del();

        // Delete quiz-question associations (don't delete the questions themselves)
        await trx('quiz_questions').where('quiz_id', id).del();

        // Delete quiz
        await trx('quizzes').where('id', id).del();
      });

      res.json({ message: 'Quiz deleted successfully' });

    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: 'Failed to delete quiz' });
    }
  }

  /**
   * Helper method to get complete quiz data with questions
   */
  async getCompleteQuizData(quizId, userId = null) {
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

    // Get questions for this quiz using junction table
    const questions = await knex('quiz_questions')
      .join('questions', 'quiz_questions.question_id', 'questions.id')
      .where('quiz_questions.quiz_id', quizId)
      .select('questions.*', 'quiz_questions.question_number')
      .orderBy('quiz_questions.question_number');

    console.log(`📋 [getCompleteQuizData] Quiz ${quizId} - Format: ${quiz.game_format || 'traditional'}, Questions count: ${questions.length}`);
    
    // DEBUG: Log the actual questions from database
    if (questions.length > 0) {
      console.log('🔍 [getCompleteQuizData] First question from database:', {
        id: questions[0].id,
        type: questions[0].type,
        question_text: questions[0].question_text?.substring(0, 100) + '...',
        pattern_data_preview: questions[0].pattern_data ? questions[0].pattern_data.substring(0, 100) + '...' : 'No pattern data',
        word_data_preview: questions[0].word_data ? questions[0].word_data.substring(0, 100) + '...' : 'No word data',
        ladder_steps_preview: questions[0].ladder_steps ? JSON.stringify(questions[0].ladder_steps).substring(0, 100) + '...' : 'No ladder steps'
      });
    }

    // Handle missing questions - ensure we always have data
    if (!questions || questions.length === 0) {
      console.log(`⚠️ [getCompleteQuizData] No questions found for quiz ${quizId}`);
      // For game formats, we might need fallback data, but for traditional quizzes this is expected behavior
      if (quiz.game_format && quiz.game_format !== 'traditional') {
        console.log(`🔄 [getCompleteQuizData] This is a game format (${quiz.game_format}) with no questions - this should be handled by gameFormatController`);
      }
    }

    return {
      ...quiz,
      metadata: safeJsonParse(quiz.metadata, {}),
      game_options: safeJsonParse(quiz.game_options, {}),
      questions: questions.map(question => ({
        ...question,
        options: question.options || null,
        concepts: safeJsonParse(question.concepts, []),
        correctAnswers: question.correct_answers_data || null,
        pairs: safeJsonParse(question.pairs, null),
        items: safeCommaParse(question.items, null),
        correct_order: question.correct_order || null, // Keep original as string
        correctOrder: safeCommaParse(question.correct_order, null), // Parse to array
        text: question.formatted_text || question.question_text,
        // Parse game-specific data safely
        word_data: question.word_data || null,
        pattern_data: question.pattern_data || null,
        ladder_steps: question.ladder_steps || null,
        // Ensure consistent boolean handling for true/false questions
        correct_answer: question.type === 'true_false' && typeof question.correct_answer === 'string' 
          ? question.correct_answer === 'True' || question.correct_answer === 'true' || question.correct_answer === 'True'
          : question.correct_answer
      }))
    };
  }

  /**
   * Helper method to detect programming language from filename
   */
  detectLanguage(filename) {
    const extension = path.extname(filename).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css',
      '.md': 'markdown',
      '.txt': 'text'
    };

    return languageMap[extension] || 'auto-detect';
  }

  /**
   * Helper method to normalize question type format for database
   */
  normalizeQuestionType(type) {
    const typeMap = {
      'multiple-choice': 'multiple_choice',
      'multiple_choice': 'multiple_choice',
      'fill-blank': 'fill_blank',
      'fill_blank': 'fill_blank',
      'fill-in-the-blank': 'fill_in_the_blank',
      'fill_in_the_blank': 'fill_in_the_blank',
      'true-false': 'true_false',
      'true_false': 'true_false',
      'matching': 'matching',
      'drag_drop_match': 'drag_drop_match',
      'drag_drop_order': 'drag_drop_order'
    };
    
    return typeMap[type] || type || 'multiple_choice';
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
   * Safely parse JSON fields that might contain actual JSON
   */
  _parseJsonField(field) {
    if (!field) return null;
    
    if (typeof field !== 'string') return field;
    
    try {
      return JSON.parse(field);
    } catch (e) {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Safely parse text fields that might be comma-separated or JSON
   */
  _parseTextField(field) {
    if (!field) return null;
    
    if (typeof field !== 'string') return field;
    
    console.log(`🔧 [_parseTextField] Processing field: ${field.substring(0, 30)}...`);
    
    // Try JSON parsing first
    try {
      const result = JSON.parse(field);
      console.log(`✅ [_parseTextField] Successfully parsed as JSON`);
      return result;
    } catch (e) {
      console.log(`📝 [_parseTextField] JSON parsing failed, returning as plain text`);
      // If JSON parsing fails, treat as plain text
      return field;
    }
  }

  /**
   * Assign quiz to batches (Admin only)
   * POST /api/quizzes/:id/assign-batches
   */
  async assignQuizToBatches(req, res) {
    try {
      const { id: quizId } = req.params;
      const { batchIds } = req.body;
      const userId = req.user.userId;

      if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Batch IDs array is required'
        });
      }

      // Verify quiz exists
      const quiz = await knex('quizzes').where('id', quizId).first();
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Verify all batches exist
      const batches = await knex('batches').whereIn('id', batchIds);
      if (batches.length !== batchIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more batches not found'
        });
      }

      // Remove existing assignments for this quiz
      await knex('quiz_batches').where('quiz_id', quizId).del();

      // Create new assignments
      const assignments = batchIds.map(batchId => ({
        quiz_id: quizId,
        batch_id: batchId,
        assigned_by: userId,
        assigned_at: new Date()
      }));

      await knex('quiz_batches').insert(assignments);

      console.log(`✅ Quiz ${quizId} assigned to ${batchIds.length} batches by admin ${userId}`);

      res.json({
        success: true,
        message: `Quiz assigned to ${batchIds.length} batch${batchIds.length !== 1 ? 'es' : ''} successfully`
      });

    } catch (error) {
      console.error('Error assigning quiz to batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign quiz to batches'
      });
    }
  }

  /**
   * Remove quiz from batch (Admin only)
   * DELETE /api/quizzes/:id/remove-batch/:batchId
   */
  async removeQuizFromBatch(req, res) {
    try {
      const { id: quizId, batchId } = req.params;

      // Verify assignment exists
      const assignment = await knex('quiz_batches')
        .where({ quiz_id: quizId, batch_id: batchId })
        .first();

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Quiz-batch assignment not found'
        });
      }

      // Remove assignment
      await knex('quiz_batches')
        .where({ quiz_id: quizId, batch_id: batchId })
        .del();

      console.log(`✅ Quiz ${quizId} removed from batch ${batchId}`);

      res.json({
        success: true,
        message: 'Quiz removed from batch successfully'
      });

    } catch (error) {
      console.error('Error removing quiz from batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove quiz from batch'
      });
    }
  }

  /**
   * Get user's available batches for quiz generation
   * GET /api/quizzes/user-batches
   */
  async getUserBatches(req, res) {
    try {
      const userId = req.user.userId;
      const User = require('../models/User');
      
      const userBatches = await User.getActiveBatches(userId);
      
      res.json({
        success: true,
        data: userBatches,
        count: userBatches.length
      });
    } catch (error) {
      console.error('❌ [QuizController] Failed to get user batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user batches',
        error: error.message
      });
    }
  }
}

const quizController = new QuizController();

module.exports = {
  generateQuiz: (req, res) => quizController.generateQuiz(req, res),
  generateEnhancedQuiz: (req, res) => quizController.generateEnhancedQuiz(req, res),
  generateDynamicQuiz: (req, res) => quizController.generateDynamicQuiz(req, res),
  getGenerationOptions: (req, res) => quizController.getGenerationOptions(req, res),
  getUserQuizzes: (req, res) => quizController.getUserQuizzes(req, res),
  getQuizById: (req, res) => quizController.getQuizById(req, res),
  deleteQuiz: (req, res) => quizController.deleteQuiz(req, res),
  getUserBatches: (req, res) => quizController.getUserBatches(req, res)
  // assignQuizToBatches: (req, res) => quizController.assignQuizToBatches(req, res),
  // removeQuizFromBatch: (req, res) => quizController.removeQuizFromBatch(req, res)
};
