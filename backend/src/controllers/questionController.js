const Question = require('../models/Question');
const { QuestionValidationService, ValidationError } = require('../services/questionValidationService');

class QuestionController {
  constructor() {
    this.validationService = new QuestionValidationService();
  }

  /**
   * Bulk create questions
   * POST /api/questions/bulk
   */
  async bulkCreate(req, res) {
    try {
      console.log('🔄 [QuestionController] Bulk create questions started');
      
      // Validate input data
      const validatedData = this.validationService.validateBulkCreate(req.body);
      
      // Validate each question's logic
      for (const question of validatedData.questions) {
        this.validationService.validateQuestionLogic(question);
      }
      
      console.log(`📝 [QuestionController] Creating ${validatedData.questions.length} questions`);
      
      // Bulk insert questions
      const createdQuestions = await Question.bulkCreate(validatedData.questions);
      
      console.log(`✅ [QuestionController] Successfully created ${createdQuestions.length} questions`);
      
      res.status(201).json({
        success: true,
        message: `Successfully created ${createdQuestions.length} questions`,
        data: {
          questions: createdQuestions,
          count: createdQuestions.length
        }
      });
      
    } catch (error) {
      console.error('❌ [QuestionController] Bulk create failed:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.details
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during bulk question creation',
        error: error.message
      });
    }
  }

  /**
   * Search questions with filters
   * GET /api/questions/search
   */
  async search(req, res) {
    try {
      console.log('🔍 [QuestionController] Search questions started');
      console.log('📝 [QuestionController] Search params:', req.query);
      
      // Validate search parameters
      const validatedParams = this.validationService.validateSearch(req.query);
      
      // Split into filters and options
      const { sortBy, sortOrder, limit, offset, ...filters } = validatedParams;
      const options = { sortBy, sortOrder, limit, offset };
      
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });
      
      console.log('🔍 [QuestionController] Applied filters:', filters);
      console.log('⚙️ [QuestionController] Search options:', options);
      
      // Get questions
      const questions = await Question.searchWithFilters(filters, options);
      
      // Get total count for pagination (without limit/offset)
      const totalQuestions = await Question.searchWithFilters(filters, {});
      const totalCount = totalQuestions.length;
      
      console.log(`✅ [QuestionController] Found ${questions.length} questions (${totalCount} total)`);
      
      res.json({
        success: true,
        data: {
          questions,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            total: totalCount,
            hasNext: (options.offset + options.limit) < totalCount,
            hasPrevious: options.offset > 0
          }
        }
      });
      
    } catch (error) {
      console.error('❌ [QuestionController] Search failed:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.details
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during question search',
        error: error.message
      });
    }
  }

  /**
   * Get question bank statistics
   * GET /api/questions/statistics
   */
  async getStatistics(req, res) {
    try {
      console.log('📊 [QuestionController] Get statistics started');
      
      const statistics = await Question.getStatistics();
      
      console.log('✅ [QuestionController] Statistics retrieved:', {
        total: statistics.total,
        domainCount: statistics.byDomain.length,
        subjectCount: statistics.bySubject.length
      });
      
      res.json({
        success: true,
        data: statistics
      });
      
    } catch (error) {
      console.error('❌ [QuestionController] Get statistics failed:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching statistics',
        error: error.message
      });
    }
  }

  /**
   * Get question by ID
   * GET /api/questions/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid question ID'
        });
      }
      
      console.log(`🔍 [QuestionController] Get question by ID: ${id}`);
      
      const question = await Question.findById(parseInt(id));
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      console.log(`✅ [QuestionController] Question found: ${question.question_text?.substring(0, 50)}...`);
      
      res.json({
        success: true,
        data: { question }
      });
      
    } catch (error) {
      console.error('❌ [QuestionController] Get by ID failed:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching question',
        error: error.message
      });
    }
  }

  /**
   * Update question by ID
   * PUT /api/questions/:id
   */
  async updateById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid question ID'
        });
      }
      
      console.log(`🔄 [QuestionController] Update question by ID: ${id}`);
      
      // Validate question data
      const validatedData = this.validationService.validateQuestion(req.body);
      this.validationService.validateQuestionLogic(validatedData);
      
      // Update question
      const updatedQuestion = await Question.update(parseInt(id), validatedData);
      
      if (!updatedQuestion) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      console.log(`✅ [QuestionController] Question updated successfully`);
      
      res.json({
        success: true,
        message: 'Question updated successfully',
        data: { question: updatedQuestion }
      });
      
    } catch (error) {
      console.error('❌ [QuestionController] Update failed:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.details
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during question update',
        error: error.message
      });
    }
  }
}

module.exports = QuestionController;
