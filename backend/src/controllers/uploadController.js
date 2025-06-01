const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { db } = require('../config/database');

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// Configure multer for file uploads
const createUploadConfig = () => {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, '../../uploads');
  
  const ensureUploadDir = async () => {
    try {
      await stat(uploadDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(uploadDir, { recursive: true });
      }
    }
  };

  // Configure storage
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureUploadDir();
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });

  // File filter function
  const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'text/plain',           // .txt files
      'text/javascript',      // .js files
      'text/x-python',        // .py files
      'text/x-java-source',   // .java files
      'text/x-c',            // .c files
      'text/x-c++src',       // .cpp files
      'application/json',     // .json files
      'text/markdown',        // .md files
      'text/html',           // .html files
      'text/css',            // .css files
      'application/pdf',      // .pdf files
      'application/msword',   // .doc files
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx files
    ];

    // Also check file extension as fallback
    const allowedExtensions = [
      '.txt', '.js', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.json', '.md', '.html', '.css', '.pdf', '.doc', '.docx',
      '.ts', '.jsx', '.tsx', '.php', '.rb', '.go', '.rs', '.swift'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5 // Maximum 5 files at once
    }
  });
};

// Initialize upload middleware
const upload = createUploadConfig();

// File upload controller functions
const uploadController = {
  // Single file upload
  uploadFile: async (req, res) => {
    try {
      const { user } = req; // From auth middleware
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Read file content for processing (but don't store large files in DB)
      const filePath = file.path;
      let content = null;
      
      // Only read content for text files under 1MB
      if (file.size < 1024 * 1024) { // 1MB limit
        try {
          content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
          // If file can't be read as text, leave content as null
          console.log('File not readable as text:', file.originalname);
        }
      }

      // Save file info to database
      const uploadRecord = await db('uploads').insert({
        user_id: user.userId,
        filename: file.filename, // Generated unique filename
        original_name: file.originalname, // Original filename
        file_path: filePath,
        content: content, // Only for small text files
        upload_date: new Date(),
        file_size: file.size,
        file_type: path.extname(file.originalname).toLowerCase(),
        mime_type: file.mimetype,
        status: 'completed'
      }).returning('*');

      // Return success response
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: uploadRecord[0].id,
          filename: uploadRecord[0].original_name,
          size: uploadRecord[0].file_size,
          type: uploadRecord[0].mime_type,
          uploadDate: uploadRecord[0].upload_date
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      
      // Clean up file if database save fails
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Multiple files upload
  uploadMultipleFiles: async (req, res) => {
    try {
      const { user } = req;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = [];
      const errors = [];

      // Process each file
      for (const file of files) {
        try {
          let content = null;
          
          // Only read content for small text files
          if (file.size < 1024 * 1024) {
            try {
              content = fs.readFileSync(file.path, 'utf8');
            } catch (error) {
              console.log('File not readable as text:', file.originalname);
            }
          }

          const uploadRecord = await db('uploads').insert({
            user_id: user.userId,
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            content: content,
            upload_date: new Date(),
            file_size: file.size,
            file_type: path.extname(file.originalname).toLowerCase(),
            mime_type: file.mimetype,
            status: 'completed'
          }).returning('*');

          uploadedFiles.push({
            id: uploadRecord[0].id,
            filename: uploadRecord[0].original_name,
            size: uploadRecord[0].file_size,
            type: uploadRecord[0].mime_type,
            uploadDate: uploadRecord[0].upload_date
          });

        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });

          // Clean up failed file
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError);
          }
        }
      }

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: {
          uploadedFiles,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Multiple file upload error:', error);

      // Clean up all files on general error
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get user's uploaded files
  getUserUploads: async (req, res) => {
    try {
      const { user } = req;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;

      // Get user's uploads with pagination
      const uploads = await db('uploads')
        .where('user_id', user.userId)
        .orderBy('upload_date', 'desc')
        .limit(limit)
        .offset(offset)
        .select('id', 'original_name as filename', 'file_size', 'mime_type as file_type', 'upload_date');

      // Get total count for pagination
      const totalCount = await db('uploads')
        .where('user_id', user.userId)
        .count('id as count')
        .first();

      res.json({
        success: true,
        data: {
          uploads,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount.count,
            totalPages: Math.ceil(totalCount.count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get uploads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve uploads',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get specific upload details
  getUploadById: async (req, res) => {
    try {
      const { user } = req;
      const { id } = req.params;

      const upload = await db('uploads')
        .where({ id, user_id: user.userId })
        .first();

      if (!upload) {
        return res.status(404).json({
          success: false,
          message: 'Upload not found'
        });
      }

      res.json({
        success: true,
        data: upload
      });

    } catch (error) {
      console.error('Get upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upload',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Delete upload
  deleteUpload: async (req, res) => {
    try {
      const { user } = req;
      const { id } = req.params;

      const upload = await db('uploads')
        .where({ id, user_id: user.userId })
        .first();

      if (!upload) {
        return res.status(404).json({
          success: false,
          message: 'Upload not found'
        });
      }

      // Delete file from filesystem
      try {
        if (fs.existsSync(upload.file_path)) {
          fs.unlinkSync(upload.file_path);
        }
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await db('uploads').where({ id, user_id: user.userId }).del();

      res.json({
        success: true,
        message: 'Upload deleted successfully'
      });

    } catch (error) {
      console.error('Delete upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete upload',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = {
  uploadController,
  upload
};
