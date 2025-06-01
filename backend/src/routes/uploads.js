const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadController, upload } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

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

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
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
