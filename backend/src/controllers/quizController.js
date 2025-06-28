const PromptService = require('../../services/promptService');
const { db: knex } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class QuizController {
  constructor() {
    this.promptService = new PromptService();
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
      
      // VERIFICATION: Check if questions were actually saved with correct data
      console.log(`🔍 Verifying saved questions...`);
      const savedQuestions = await knex('questions').where('quiz_id', quizId).select('*');
      console.log(`📊 Verification results:`, {
        expectedCount: questions.length,
        actualCount: savedQuestions.length,
        sampleQuestion: savedQuestions[0] ? {
          id: savedQuestions[0].id,
          type: savedQuestions[0].type,
          question_text: savedQuestions[0].question_text?.substring(0, 50) + '...',
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
   * Get all quizzes for current user
   * GET /api/quizzes
   */
  async getUserQuizzes(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const quizzes = await knex('quizzes')
        .select([
          'quizzes.*',
          'uploads.filename',
          'uploads.file_type'
        ])
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
        .where('quizzes.user_id', userId)
        .orderBy('quizzes.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCount = await knex('quizzes')
        .where('user_id', userId)
        .count('id as count')
        .first();

      // Log for debugging game formats
      console.log('📋 Fetched quizzes for user', userId, ':', quizzes.map(q => ({
        id: q.id, 
        title: q.title, 
        game_format: q.game_format,
        total_questions: q.total_questions
      })));

      res.json({
        quizzes: quizzes.map(quiz => ({
          ...quiz,
          metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {},
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

      const quiz = await this.getCompleteQuizData(id, userId);

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

        // Delete questions
        await trx('questions').where('quiz_id', id).del();

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

    // Get questions for this quiz
    const questions = await knex('questions')
      .where('quiz_id', quizId)
      .orderBy('question_number');

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
      metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {},
      game_options: quiz.game_options ? JSON.parse(quiz.game_options) : {},
      questions: questions.map(question => ({
        ...question,
        options: question.options ? JSON.parse(question.options) : null,
        concepts: JSON.parse(question.concepts || '[]'),
        correctAnswers: question.correct_answers_data ? JSON.parse(question.correct_answers_data) : null,
        pairs: question.pairs ? JSON.parse(question.pairs) : null,
        items: question.items ? JSON.parse(question.items) : null,
        correctOrder: question.correct_order ? JSON.parse(question.correct_order) : null,
        text: question.formatted_text || question.question_text,
        // Parse game-specific data safely
        word_data: question.word_data ? (typeof question.word_data === 'string' ? JSON.parse(question.word_data) : question.word_data) : null,
        pattern_data: question.pattern_data ? (typeof question.pattern_data === 'string' ? JSON.parse(question.pattern_data) : question.pattern_data) : null,
        ladder_steps: question.ladder_steps ? (typeof question.ladder_steps === 'string' ? JSON.parse(question.ladder_steps) : question.ladder_steps) : null,
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
}

const quizController = new QuizController();

module.exports = {
  generateQuiz: (req, res) => quizController.generateQuiz(req, res),
  generateEnhancedQuiz: (req, res) => quizController.generateEnhancedQuiz(req, res),
  getUserQuizzes: (req, res) => quizController.getUserQuizzes(req, res),
  getQuizById: (req, res) => quizController.getQuizById(req, res),
  deleteQuiz: (req, res) => quizController.deleteQuiz(req, res)
};
