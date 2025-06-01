const aiService = require('../services/aiService');

const aiController = {
  // Test AI API connection
  testConnection: async (req, res) => {
    try {
      const result = await aiService.testConnection();
      
      res.json({
        success: result.success,
        message: result.message,
        data: result.success ? {
          model: result.model,
          response: result.response,
          usage: result.usage
        } : null,
        error: result.success ? null : result.error
      });
    } catch (error) {
      console.error('AI connection test error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test AI connection',
        error: error.message
      });
    }
  },

  // Get AI service status
  getStatus: async (req, res) => {
    try {
      const status = aiService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('AI status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI status',
        error: error.message
      });
    }
  },

  // Generate quiz from uploaded content
  generateQuiz: async (req, res) => {
    try {
      const { uploadId, options = {} } = req.body;
      const { user } = req;

      if (!uploadId) {
        return res.status(400).json({
          success: false,
          message: 'Upload ID is required'
        });
      }

      // Get upload content from database
      const { db } = require('../config/database');
      const FileUtils = require('../utils/fileUtils');
      
      const upload = await FileUtils.getUploadWithContent(db, uploadId, user.userId);

      if (!upload) {
        return res.status(404).json({
          success: false,
          message: 'Upload not found'
        });
      }

      // Generate quiz using AI service
      const result = await aiService.generateQuizQuestions(upload.content, {
        numQuestions: options.numQuestions || 5,
        difficulty: options.difficulty || 'medium',
        questionTypes: options.questionTypes || ['multiple-choice'],
        language: options.language || 'auto-detect'
      });

      // Save quiz to database
      const quizData = {
        upload_id: uploadId,
        title: `Quiz for ${upload.filename}`,
        difficulty: options.difficulty || 'medium',
        created_at: new Date(),
        questions_data: JSON.stringify(result.questions)
      };

      const [quizId] = await db('quizzes').insert(quizData).returning('id');

      // Save individual questions
      const questionsToInsert = result.questions.map((question, index) => ({
        quiz_id: quizId,
        question_number: index + 1,
        type: question.type,
        content: question.question,
        options: JSON.stringify(question.options || []),
        correct_answer: question.correct_answer,
        explanation: question.explanation || '',
        difficulty: question.difficulty || options.difficulty || 'medium',
        concept: question.concept || ''
      }));

      await db('questions').insert(questionsToInsert);

      res.status(201).json({
        success: true,
        message: 'Quiz generated successfully',
        data: {
          quizId: quizId,
          title: quizData.title,
          questionsCount: result.questions.length,
          difficulty: quizData.difficulty,
          metadata: result.metadata
        }
      });

    } catch (error) {
      console.error('Quiz generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quiz',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Explain code content
  explainCode: async (req, res) => {
    try {
      const { uploadId, code, language } = req.body;
      const { user } = req;

      let contentToExplain = code;

      // If uploadId is provided, get content from database
      if (uploadId && !code) {
        const { db } = require('../config/database');
        const FileUtils = require('../utils/fileUtils');
        
        const upload = await FileUtils.getUploadWithContent(db, uploadId, user.userId);

        if (!upload) {
          return res.status(404).json({
            success: false,
            message: 'Upload not found'
          });
        }

        contentToExplain = upload.content;
      }

      if (!contentToExplain) {
        return res.status(400).json({
          success: false,
          message: 'Code content or upload ID is required'
        });
      }

      const result = await aiService.explainCode(contentToExplain, language);

      res.json({
        success: true,
        data: {
          explanation: result.explanation,
          metadata: result.metadata
        }
      });

    } catch (error) {
      console.error('Code explanation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to explain code',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get available AI features and limits
  getFeatures: async (req, res) => {
    try {
      const status = aiService.getStatus();
      
      res.json({
        success: true,
        data: {
          available: status.configured,
          provider: status.provider,
          model: status.model,
          features: status.features,
          limits: {
            maxQuestions: 20,
            maxContentLength: 4000,
            supportedLanguages: [
              'javascript', 'python', 'java', 'c', 'cpp', 
              'html', 'css', 'json', 'markdown', 'typescript',
              'php', 'ruby', 'go', 'rust', 'swift'
            ],
            questionTypes: ['multiple-choice', 'true-false', 'fill-blank'],
            difficulties: ['easy', 'medium', 'hard']
          }
        }
      });
    } catch (error) {
      console.error('AI features error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI features',
        error: error.message
      });
    }
  }
};

module.exports = aiController;
