const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadController, upload } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const { getNotebookSummary, extractJupyterCells } = require('../../utils/jupyterUtils');
const { db: knex } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Apply authentication middleware to all upload routes
router.use(authenticateToken);

// Single file upload
router.post(
  '/single', 
  upload.single('file'), 
  uploadController.uploadFile
);

// Multiple files upload
router.post(
  '/multiple', 
  upload.array('files', 5), 
  uploadController.uploadMultipleFiles
);

// Get user's uploads
router.get('/', uploadController.getUserUploads);

// Get specific upload
router.get('/:id', uploadController.getUploadById);

// Delete upload
router.delete('/:id', uploadController.deleteUpload);

/**
 * NEW: Get Jupyter notebook cell summary for user selection
 * GET /api/uploads/:uploadId/cells
 */
router.get('/:uploadId/cells', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Get upload information
    const upload = await knex('uploads').where('id', uploadId).first();
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }
    
    // Check if it's a Jupyter notebook
    if (!upload.filename.endsWith('.ipynb')) {
      return res.status(400).json({
        success: false,
        message: 'File is not a Jupyter notebook'
      });
    }
    
    // Read file content
    const filePath = path.join(__dirname, '../../uploads', upload.filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Get notebook summary
    const summary = getNotebookSummary(content);
    
    if (summary.error) {
      return res.status(400).json({
        success: false,
        message: summary.error
      });
    }
    
    res.json({
      success: true,
      data: {
        uploadId,
        filename: upload.filename,
        ...summary
      }
    });
    
  } catch (error) {
    console.error('Error getting notebook cells:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze notebook cells'
    });
  }
});

/**
 * NEW: Extract specific cells from Jupyter notebook
 * POST /api/uploads/:uploadId/extract-cells
 * Body: { cellIndices: [0, 2, 5] }
 */
router.post('/:uploadId/extract-cells', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { cellIndices } = req.body;
    
    if (!Array.isArray(cellIndices)) {
      return res.status(400).json({
        success: false,
        message: 'cellIndices must be an array of numbers'
      });
    }
    
    // Get upload information
    const upload = await knex('uploads').where('id', uploadId).first();
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }
    
    // Read file content
    const filePath = path.join(__dirname, '../../uploads', upload.filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract specified cells
    const extraction = extractJupyterCells(content, cellIndices);
    
    res.json({
      success: true,
      data: {
        uploadId,
        filename: upload.filename,
        extractedContent: extraction.content,
        metadata: extraction.metadata,
        cellCount: extraction.cells.length,
        originalCellCount: extraction.originalCellCount
      }
    });
    
  } catch (error) {
    console.error('Error extracting notebook cells:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract notebook cells'
    });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  const MAX_FILE_SIZE_KB = parseInt(process.env.MAX_FILE_SIZE_KB) || 10;
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE_KB}KB.`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Upload failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;
