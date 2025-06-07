const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { fileTypeFromFile } = require('file-type');
const { db } = require('../config/database');

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

// Get max file size from environment (default 10KB)
const MAX_FILE_SIZE_KB = parseInt(process.env.MAX_FILE_SIZE_KB) || 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_KB * 1024; // Convert KB to bytes

console.log(`📁 File Upload Configuration:`);
console.log(`   - Max file size: ${MAX_FILE_SIZE_KB}KB (${MAX_FILE_SIZE} bytes)`);

// Advanced file type validation using file-type library
const validateFileType = async (filePath, originalName) => {
  try {
    // Get actual file type from file content
    const fileType = await fileTypeFromFile(filePath);
    
    // Allowed coding file extensions
    const allowedExtensions = [
      '.ipynb',  // Jupyter notebooks
      '.py',     // Python
      '.java',   // Java
      '.ts',     // TypeScript
      '.js',     // JavaScript
      '.jsx',    // React JavaScript
      '.tsx',    // React TypeScript
      '.cpp',    // C++
      '.c',      // C
      '.h',      // C/C++ headers
      '.hpp',    // C++ headers
      '.cs',     // C#
      '.php',    // PHP
      '.rb',     // Ruby
      '.go',     // Go
      '.rs',     // Rust
      '.swift',  // Swift
      '.kt',     // Kotlin
      '.scala',  // Scala
      '.r',      // R
      '.sql',    // SQL
      '.sh',     // Shell scripts
      '.json',   // JSON
      '.yaml',   // YAML
      '.yml',    // YAML
      '.xml',    // XML
      '.html',   // HTML
      '.css',    // CSS
      '.scss',   // SCSS
      '.md',     // Markdown
      '.txt'     // Plain text
    ];

    const ext = path.extname(originalName).toLowerCase();
    
    // Check if extension is allowed
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension '${ext}' not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      };
    }

    // For most text-based coding files, file-type library may return null
    // This is expected for plain text files like .py, .js, etc.
    // We'll accept files with allowed extensions that are text-based
    const textBasedExtensions = [
      '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r',
      '.sql', '.sh', '.json', '.yaml', '.yml', '.xml', '.html', '.css',
      '.scss', '.md', '.txt'
    ];

    if (textBasedExtensions.includes(ext) && (!fileType || fileType.mime.startsWith('text/'))) {
      return { valid: true };
    }

    // For .ipynb (Jupyter notebooks) - should be JSON
    if (ext === '.ipynb') {
      if (!fileType || fileType.mime === 'application/json') {
        return { valid: true };
      }
    }

    // If we have a detected file type, check if it's appropriate
    if (fileType) {
      const allowedMimeTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'application/json',
        'application/xml'
      ];

      if (allowedMimeTypes.includes(fileType.mime)) {
        return { valid: true };
      }

      return {
        valid: false,
        error: `File content type '${fileType.mime}' doesn't match expected type for '${ext}' files`
      };
    }

    // If no file type detected but extension is text-based, allow it
    return { valid: true };

  } catch (error) {
    console.error('File type validation error:', error);
    return {
      valid: false,
      error: 'Could not validate file type'
    };
  }
};

// Configure multer for file uploads
const createUploadConfig = () => {
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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });

  // Simple file filter - basic extension check
  const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
      '.ipynb', '.py', '.java', '.ts', '.js', '.jsx', '.tsx', '.cpp', '.c',
      '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
      '.scala', '.r', '.sql', '.sh', '.json', '.yaml', '.yml', '.xml',
      '.html', '.css', '.scss', '.md', '.txt'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE, // Use the dynamically calculated value
      files: 5
    }
  });
};

const upload = createUploadConfig();

const uploadController = {
  uploadFile: async (req, res) => {
    try {
      const { user } = req;
      const file = req.file;

      console.log(`📁 File upload attempt: ${file ? file.originalname : 'No file'} - Size: ${file ? file.size : 0} bytes - Limit: ${MAX_FILE_SIZE} bytes`);

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Check file size explicitly (multer should have caught this, but double-check)
      if (file.size > MAX_FILE_SIZE) {
        console.log(`⚠️  File too large: ${file.size} bytes > ${MAX_FILE_SIZE} bytes`);
        // Clean up uploaded file
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
        
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE_KB}KB.`
        });
      }

      // Enhanced file type validation using file-type library
      const validation = await validateFileType(file.path, file.originalname);
      if (!validation.valid) {
        // Clean up uploaded file
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
        
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Read file content (since files are small now)
      let content = null;
      try {
        content = fs.readFileSync(file.path, 'utf8');
      } catch (error) {
        console.log('File not readable as text:', file.originalname);
      }

      // Save to database
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

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: uploadRecord[0].id,
          filename: uploadRecord[0].original_name,
          size: uploadRecord[0].file_size,
          type: uploadRecord[0].mime_type,
          uploadDate: uploadRecord[0].upload_date,
          maxFileSize: `${MAX_FILE_SIZE_KB}KB`
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      
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

      for (const file of files) {
        try {
          // Validate each file
          const validation = await validateFileType(file.path, file.originalname);
          if (!validation.valid) {
            errors.push({
              filename: file.originalname,
              error: validation.error
            });
            fs.unlinkSync(file.path);
            continue;
          }

          let content = null;
          try {
            content = fs.readFileSync(file.path, 'utf8');
          } catch (error) {
            console.log('File not readable as text:', file.originalname);
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
          errors: errors.length > 0 ? errors : undefined,
          maxFileSize: `${MAX_FILE_SIZE_KB}KB`
        }
      });

    } catch (error) {
      console.error('Multiple file upload error:', error);

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

  getUserUploads: async (req, res) => {
    try {
      const { user } = req;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;

      const uploads = await db('uploads')
        .where('user_id', user.userId)
        .orderBy('upload_date', 'desc')
        .limit(limit)
        .offset(offset)
        .select('id', 'original_name as filename', 'file_size', 'mime_type as file_type', 'upload_date');

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
          },
          maxFileSize: `${MAX_FILE_SIZE_KB}KB`
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

      try {
        if (fs.existsSync(upload.file_path)) {
          fs.unlinkSync(upload.file_path);
        }
      } catch (fileError) {
        console.error('File deletion error:', fileError);
      }

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
