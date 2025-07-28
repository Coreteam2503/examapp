const Batch = require('../models/Batch');
const Question = require('../models/Question');
const User = require('../models/User');

class BatchController {
  // Create a new batch
  static async createBatch(req, res) {
    try {
      const { name, description, subject, domain } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Batch name is required'
        });
      }
      
      const batchData = {
        name,
        description,
        subject: subject || 'General',
        domain: domain || 'General',
        created_by: req.user?.id || 1,
        is_active: true
      };
      
      const batch = await Batch.create(batchData);
      
      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: batch
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create batch',
        error: error.message
      });
    }
  }

  // Get all batches with filtering
  static async getBatches(req, res) {
    try {
      const {
        isActive,
        createdBy,
        subject,
        domain,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;
      
      const options = {
        sortBy,
        sortOrder
      };
      
      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }
      
      if (createdBy) {
        options.createdBy = parseInt(createdBy);
      }
      
      if (subject) {
        options.subject = subject;
      }
      
      if (domain) {
        options.domain = domain;
      }
      
      const batches = await Batch.findAll(options);
      
      res.json({
        success: true,
        data: batches,
        count: batches.length
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches',
        error: error.message
      });
    }
  }

  // Get a specific batch by ID
  static async getBatch(req, res) {
    try {
      const { id } = req.params;
      const batch = await Batch.findById(id);
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      res.json({
        success: true,
        data: batch
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch',
        error: error.message
      });
    }
  }

  // Update a batch
  static async updateBatch(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const updatedBatch = await Batch.update(id, updateData);
      
      res.json({
        success: true,
        message: 'Batch updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch',
        error: error.message
      });
    }
  }

  // Delete a batch
  static async deleteBatch(req, res) {
    try {
      const { id } = req.params;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      await Batch.delete(id);
      
      res.json({
        success: true,
        message: 'Batch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete batch',
        error: error.message
      });
    }
  }

  // Get users in a batch
  static async getBatchUsers(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.query;
      
      const options = {};
      if (isActive !== undefined) {
        options.isActive = isActive === 'true';
      }
      
      const users = await Batch.getUsers(id, options);
      
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Error fetching batch users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch users',
        error: error.message
      });
    }
  }

  // Get questions in a batch
  static async getBatchQuestions(req, res) {
    try {
      const { id } = req.params;
      const { type, difficulty_level } = req.query;
      
      const options = {};
      if (type) options.type = type;
      if (difficulty_level) options.difficulty_level = difficulty_level;
      
      const questions = await Batch.getQuestions(id, options);
      
      res.json({
        success: true,
        data: questions,
        count: questions.length
      });
    } catch (error) {
      console.error('Error fetching batch questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch questions',
        error: error.message
      });
    }
  }

  // Get quizzes available to a batch
  static async getBatchQuizzes(req, res) {
    try {
      const { id } = req.params;
      
      const quizzes = await Batch.getBatchQuizzes(id);
      
      res.json({
        success: true,
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      console.error('Error fetching batch quizzes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch quizzes',
        error: error.message
      });
    }
  }

  // Update batch criteria
  static async updateBatchCriteria(req, res) {
    try {
      const { id } = req.params;
      const { criteria } = req.body;
      
      if (!criteria) {
        return res.status(400).json({
          success: false,
          message: 'Criteria object is required'
        });
      }
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const updatedBatch = await Batch.updateBatchCriteria(id, criteria);
      
      res.json({
        success: true,
        message: 'Batch criteria updated successfully',
        data: updatedBatch
      });
    } catch (error) {
      console.error('Error updating batch criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch criteria',
        error: error.message
      });
    }
  }

  // Assign user to batch
  static async assignUser(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const result = await Batch.assignUser(id, userId);
      
      if (!result) {
        return res.status(409).json({
          success: false,
          message: 'User is already assigned to this batch'
        });
      }
      
      res.json({
        success: true,
        message: 'User assigned to batch successfully'
      });
    } catch (error) {
      console.error('Error assigning user to batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign user to batch',
        error: error.message
      });
    }
  }

  // Assign question to batch
  static async assignQuestion(req, res) {
    try {
      const { id } = req.params;
      const { questionId } = req.body;
      
      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: 'Question ID is required'
        });
      }
      
      const result = await Batch.assignQuestion(id, questionId);
      
      if (!result) {
        return res.status(409).json({
          success: false,
          message: 'Question is already assigned to this batch'
        });
      }
      
      res.json({
        success: true,
        message: 'Question assigned to batch successfully'
      });
    } catch (error) {
      console.error('Error assigning question to batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign question to batch',
        error: error.message
      });
    }
  }

  // Remove user from batch
  static async removeUser(req, res) {
    try {
      const { id, userId } = req.params;
      
      await Batch.removeUser(id, userId);
      
      res.json({
        success: true,
        message: 'User removed from batch successfully'
      });
    } catch (error) {
      console.error('Error removing user from batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from batch',
        error: error.message
      });
    }
  }

  // Remove question from batch
  static async removeQuestion(req, res) {
    try {
      const { id, questionId } = req.params;
      
      await Batch.removeQuestion(id, questionId);
      
      res.json({
        success: true,
        message: 'Question removed from batch successfully'
      });
    } catch (error) {
      console.error('Error removing question from batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove question from batch',
        error: error.message
      });
    }
  }

  // Get batch statistics
  static async getBatchStatistics(req, res) {
    try {
      const { id } = req.params;
      
      const batch = await Batch.findById(id);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      
      const statistics = await Batch.getStatistics(id);
      
      res.json({
        success: true,
        data: {
          batch: batch,
          statistics: statistics
        }
      });
    } catch (error) {
      console.error('Error fetching batch statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch statistics',
        error: error.message
      });
    }
  }

  // Bulk assign questions to batch
  static async bulkAssignQuestions(req, res) {
    try {
      const { id } = req.params;
      const { questionIds } = req.body;
      
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Question IDs array is required'
        });
      }
      
      const results = [];
      for (const questionId of questionIds) {
        try {
          const result = await Batch.assignQuestion(id, questionId);
          results.push({ questionId, success: result });
        } catch (error) {
          results.push({ questionId, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        message: `${successCount} of ${questionIds.length} questions assigned successfully`,
        data: results
      });
    } catch (error) {
      console.error('Error bulk assigning questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk assign questions',
        error: error.message
      });
    }
  }
}

module.exports = BatchController;
