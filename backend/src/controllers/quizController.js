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
    try {
      const { 
        uploadId, 
        difficulty = 'medium', 
        numQuestions = 5, 
        questionTypes = ['multiple_choice'],
        includeHints = false
      } = req.body;
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
      } else if (upload.file_path) {
        const filePath = path.join(__dirname, '../../uploads', upload.file_path);
        try {
          content = await fs.readFile(filePath, 'utf8');
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

      // Generate quiz using LLM with enhanced options
      console.log(`Generating enhanced quiz for upload ${uploadId} with types: ${questionTypes.join(', ')}`);
      
      const quizData = await this.promptService.generateQuizFromContent(content, {
        difficulty,
        numQuestions: parseInt(numQuestions),
        questionTypes,
        language: this.detectLanguage(upload.filename),
        includeHints
      });

      // Store quiz in database with enhanced title
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

      // Store questions with enhanced data
      const questions = quizData.questions.map((question, index) => {
        const normalizedType = this.normalizeQuestionType(question.type);
        
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

      await knex('questions').insert(questions);

      // Get the complete quiz data to return
      const completeQuiz = await this.getCompleteQuizData(quizId);

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
      console.error('Error generating enhanced quiz:', error);
      res.status(500).json({ 
        error: 'Failed to generate enhanced quiz',
        details: error.message 
      });
    }
  }
  async generateQuiz(req, res) {
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
        // Content is stored in database
        content = upload.content;
      } else if (upload.file_path) {
        // Content is stored as file
        const filePath = path.join(__dirname, '../../uploads', upload.file_path);
        try {
          content = await fs.readFile(filePath, 'utf8');
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
      console.log(`Generating quiz for upload ${uploadId} with ${numQuestions} questions at ${difficulty} difficulty`);
      
      // Include a mix of question types for more variety
      const questionTypes = ['multiple-choice', 'true-false', 'fill-in-the-blank'];
      
      const quizData = await this.promptService.generateQuizFromContent(content, {
        difficulty,
        numQuestions: parseInt(numQuestions),
        questionTypes,
        language: this.detectLanguage(upload.filename)
      });

      // Store quiz in database
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

      // Store questions
      const questions = quizData.questions.map((question, index) => {
        const normalizedType = this.normalizeQuestionType(question.type);
        
        return {
          quiz_id: quizId,
          question_number: index + 1,
          type: normalizedType,
          question_text: question.question,
          code_snippet: question.code_snippet || null,
          options: question.options ? JSON.stringify(question.options) : null,
          correct_answer: question.correct_answer || null,
          // Store correctAnswers for fill-in-the-blank questions
          correct_answers_data: question.correctAnswers ? JSON.stringify(question.correctAnswers) : null,
          // Store pairs for matching questions
          pairs: question.pairs ? JSON.stringify(question.pairs) : null,
          explanation: question.explanation,
          difficulty: question.difficulty || difficulty,
          concepts: JSON.stringify(question.concepts || []),
          hint: question.hint || null,
          // Store the formatted text for fill-in-blank questions
          formatted_text: question.text || question.question,
          created_at: new Date()
        };
      });

      await knex('questions').insert(questions);

      // Get the complete quiz data to return
      const completeQuiz = await this.getCompleteQuizData(quizId);

      res.status(201).json({
        message: 'Quiz generated successfully',
        quiz: completeQuiz
      });

    } catch (error) {
      console.error('Error generating quiz:', error);
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

      res.json({
        quizzes: quizzes.map(quiz => ({
          ...quiz,
          metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {}
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

    return {
      ...quiz,
      metadata: quiz.metadata ? JSON.parse(quiz.metadata) : {},
      questions: questions.map(question => ({
        ...question,
        options: question.options ? JSON.parse(question.options) : null,
        concepts: JSON.parse(question.concepts || '[]'),
        correctAnswers: question.correct_answers_data ? JSON.parse(question.correct_answers_data) : null,
        pairs: question.pairs ? JSON.parse(question.pairs) : null,
        text: question.formatted_text || question.question_text
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
      'matching': 'matching'
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
