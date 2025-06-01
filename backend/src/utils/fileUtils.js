const fs = require('fs');
const path = require('path');

/**
 * Utility functions for file operations
 */
class FileUtils {
  /**
   * Read file content from filesystem
   * @param {string} filePath - Path to the file
   * @returns {string|null} - File content or null if can't read
   */
  static async readFileContent(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  /**
   * Get file info from database and read content if needed
   * @param {Object} db - Database instance
   * @param {number} uploadId - Upload ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Upload record with content
   */
  static async getUploadWithContent(db, uploadId, userId) {
    try {
      const upload = await db('uploads')
        .where({ id: uploadId, user_id: userId })
        .first();

      if (!upload) {
        return null;
      }

      // If content is stored in DB, use it
      if (upload.content) {
        return upload;
      }

      // Otherwise, read from file system
      const content = await this.readFileContent(upload.file_path);
      return {
        ...upload,
        content
      };
    } catch (error) {
      console.error('Error getting upload with content:', error);
      return null;
    }
  }

  /**
   * Check if file is a text file that can be processed
   * @param {string} mimetype - File mime type
   * @param {string} filename - File name
   * @returns {boolean}
   */
  static isTextFile(mimetype, filename) {
    const textTypes = [
      'text/plain',
      'text/javascript',
      'application/javascript',
      'text/html',
      'text/css',
      'application/json',
      'text/markdown'
    ];

    const textExtensions = [
      '.txt', '.js', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.json', '.md', '.html', '.css', '.ts', '.jsx', '.tsx',
      '.php', '.rb', '.go', '.rs', '.swift'
    ];

    const ext = path.extname(filename).toLowerCase();
    
    return textTypes.includes(mimetype) || textExtensions.includes(ext);
  }

  /**
   * Delete file from filesystem
   * @param {string} filePath - Path to the file
   * @returns {boolean} - Success status
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return true; // File doesn't exist, consider it deleted
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileUtils;
