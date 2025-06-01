import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/apiService';

const FileUpload = ({ onUploadSuccess, maxFiles = 5 }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const { token } = useAuth();

  // Supported file types
  const supportedTypes = [
    '.txt', '.js', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
    '.json', '.md', '.html', '.css', '.pdf', '.doc', '.docx',
    '.ts', '.jsx', '.tsx', '.php', '.rb', '.go', '.rs', '.swift'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is 10MB.`);
    }
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!supportedTypes.includes(fileExtension)) {
      errors.push(`File type "${fileExtension}" is not supported. Supported types: ${supportedTypes.join(', ')}`);
    }
    
    return errors;
  };

  const generatePreview = async (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const textTypes = ['.txt', '.js', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.json', '.md', '.html', '.css', '.ts', '.jsx', '.tsx', '.php', '.rb', '.go', '.rs', '.swift'];
    
    if (textTypes.includes(fileExtension)) {
      try {
        const text = await file.text();
        return {
          type: 'text',
          content: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
          language: fileExtension.substring(1)
        };
      } catch (error) {
        return { type: 'error', content: 'Unable to preview file' };
      }
    }
    
    return { type: 'binary', content: 'Binary file - preview not available' };
  };

  const processFiles = async (files) => {
    setError('');
    setSuccess('');
    
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    
    // Validate all files
    const allErrors = [];
    files.forEach(file => {
      const fileErrors = validateFile(file);
      allErrors.push(...fileErrors);
    });
    
    if (allErrors.length > 0) {
      setError(allErrors.join(' '));
      return;
    }
    
    // Generate previews
    const previews = await Promise.all(
      files.map(async (file, index) => ({
        id: index,
        file,
        preview: await generatePreview(file)
      }))
    );
    
    setSelectedFiles(files);
    setPreviewFiles(previews);
  };

  const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files);
    await processFiles(files);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      if (selectedFiles.length === 1) {
        formData.append('file', selectedFiles[0]);
        
        const response = await apiService.uploads.single(formData);
        const result = response.data;
        
        if (result.success) {
          setSuccess(`File "${selectedFiles[0].name}" uploaded successfully!`);
          clearAll();
          if (onUploadSuccess) {
            onUploadSuccess(result.data);
          }
        } else {
          setError(result.message || 'Upload failed');
        }
      } else {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await apiService.uploads.multiple(formData);
        const result = response.data;
        
        if (result.success) {
          const uploadedCount = result.data.uploadedFiles.length;
          setSuccess(`${uploadedCount} files uploaded successfully!`);
          
          if (result.data.errors && result.data.errors.length > 0) {
            const errorMessages = result.data.errors.map(err => err.error).join(', ');
            setError(`Some files failed: ${errorMessages}`);
          }
          
          clearAll();
          if (onUploadSuccess) {
            onUploadSuccess(result.data.uploadedFiles);
          }
        } else {
          setError(result.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorResponse = handleApiError(error);
      setError(errorResponse.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewFiles.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewFiles(newPreviews);
    
    if (fileInputRef.current && newFiles.length === 0) {
      fileInputRef.current.value = '';
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setPreviewFiles([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'js': '📄', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️',
      'py': '🐍', 'java': '☕', 'c': '🔧', 'cpp': '🔧', 'h': '🔧', 'hpp': '🔧',
      'html': '🌐', 'css': '🎨', 'json': '📋', 'md': '📝',
      'pdf': '📕', 'doc': '📝', 'docx': '📝',
      'php': '🐘', 'rb': '💎', 'go': '🐹', 'rs': '🦀', 'swift': '🍎'
    };
    return iconMap[ext] || '📄';
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <h3>Upload Files</h3>
        <p className="upload-description">
          Drag and drop files here or click to browse. Supported formats: {supportedTypes.join(', ')}
        </p>
        
        {/* Drag and Drop Zone */}
        <div 
          ref={dropZoneRef}
          className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'disabled' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelection}
            accept={supportedTypes.join(',')}
            className="file-input-hidden"
            disabled={uploading}
          />
          
          <div className="drop-zone-content">
            {isDragOver ? (
              <>
                <div className="drop-icon">📂</div>
                <p className="drop-text">Drop files here!</p>
              </>
            ) : (
              <>
                <div className="upload-icon">☁️</div>
                <p className="upload-text">
                  <strong>Drag and drop files here</strong>
                </p>
                <p className="upload-subtext">
                  or click to browse your computer
                </p>
                <p className="file-info">
                  Maximum {maxFiles} files, 10MB each
                </p>
              </>
            )}
          </div>
        </div>

        {/* Selected Files with Previews */}
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <div className="files-header">
              <h4>Selected Files ({selectedFiles.length})</h4>
              <button 
                onClick={clearAll} 
                className="clear-btn"
                disabled={uploading}
              >
                Clear All
              </button>
            </div>
            
            <div className="files-list">
              {previewFiles.map((fileData, index) => (
                <div key={index} className="file-item-enhanced">
                  <div className="file-header">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(fileData.file.name)}</span>
                      <div className="file-details">
                        <span className="file-name">{fileData.file.name}</span>
                        <span className="file-size">{formatFileSize(fileData.file.size)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="remove-btn"
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* File Preview */}
                  <div className="file-preview">
                    {fileData.preview.type === 'text' ? (
                      <div className="text-preview">
                        <div className="preview-header">
                          <span className="language-tag">{fileData.preview.language}</span>
                          <span className="preview-label">Preview</span>
                        </div>
                        <pre className="preview-content">
                          <code>{fileData.preview.content}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="binary-preview">
                        <span className="binary-icon">📁</span>
                        <span className="binary-text">{fileData.preview.content}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... Please wait</p>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="message success-message">
            {success}
          </div>
        )}

        {/* Upload Button */}
        <div className="upload-actions">
          <button 
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || uploading}
            className="upload-btn"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .file-upload-container {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 0 auto;
        }

        .upload-section h3 {
          margin-bottom: 0.5rem;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .upload-description {
          color: #7f8c8d;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .drop-zone {
          border: 3px dashed #bdc3c7;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fafbfc;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .drop-zone:hover:not(.disabled) {
          border-color: #3498db;
          background: #f0f8ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
        }

        .drop-zone.drag-over {
          border-color: #2ecc71;
          background: #f0fff4;
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(46, 204, 113, 0.2);
        }

        .drop-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #ecf0f1;
        }

        .file-input-hidden {
          display: none;
        }

        .drop-zone-content {
          pointer-events: none;
        }

        .upload-icon, .drop-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .drop-icon {
          animation: bounce 0.6s ease-in-out infinite alternate;
        }

        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }

        .upload-text {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }

        .upload-subtext {
          color: #7f8c8d;
          margin-bottom: 1rem;
        }

        .drop-text {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2ecc71;
          margin: 0;
        }

        .file-info {
          font-size: 0.875rem;
          color: #95a5a6;
          margin: 0;
        }

        .selected-files {
          margin-bottom: 2rem;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          overflow: hidden;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
          border-bottom: 1px solid #ecf0f1;
        }

        .files-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .clear-btn {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s;
        }

        .clear-btn:hover:not(:disabled) {
          background: #c0392b;
        }

        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .files-list {
          padding: 0;
        }

        .file-item-enhanced {
          border-bottom: 1px solid #ecf0f1;
          transition: background 0.2s;
        }

        .file-item-enhanced:last-child {
          border-bottom: none;
        }

        .file-item-enhanced:hover {
          background: #f8f9fa;
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-grow: 1;
        }

        .file-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .file-name {
          font-weight: 500;
          color: #2c3e50;
          word-break: break-word;
          margin-bottom: 0.25rem;
        }

        .file-size {
          font-size: 0.875rem;
          color: #7f8c8d;
        }

        .remove-btn {
          background: #e74c3c;
          color: white;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          line-height: 1;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .remove-btn:hover:not(:disabled) {
          background: #c0392b;
          transform: scale(1.1);
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-preview {
          padding: 0 1.5rem 1rem 1.5rem;
        }

        .text-preview {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: #e9ecef;
          border-bottom: 1px solid #dee2e6;
        }

        .language-tag {
          background: #6c757d;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .preview-label {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: 500;
        }

        .preview-content {
          margin: 0;
          padding: 0.75rem;
          background: white;
          font-size: 0.875rem;
          line-height: 1.4;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 200px;
          overflow-y: auto;
        }

        .preview-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          color: #333;
        }

        .binary-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          color: #6c757d;
        }

        .binary-icon {
          font-size: 1.25rem;
        }

        .binary-text {
          font-style: italic;
        }

        .upload-progress {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3498db, #2980b9);
          transition: width 0.3s ease;
          border-radius: 5px;
        }

        .upload-progress p {
          text-align: center;
          color: #6c757d;
          margin: 0;
          font-weight: 500;
        }

        .message {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid;
        }

        .error-message {
          background: #fee;
          border-color: #fcc;
          color: #c33;
        }

        .success-message {
          background: #efe;
          border-color: #cfc;
          color: #363;
        }

        .upload-actions {
          text-align: center;
        }

        .upload-btn {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        }

        .upload-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2980b9, #1f639a);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
        }

        .upload-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .file-upload-container {
            padding: 1rem;
            margin: 0 1rem;
          }

          .drop-zone {
            padding: 2rem 1rem;
          }

          .upload-icon, .drop-icon {
            font-size: 2.5rem;
          }

          .upload-text {
            font-size: 1.1rem;
          }

          .files-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .file-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .file-info {
            width: 100%;
          }

          .remove-btn {
            align-self: flex-end;
          }

          .preview-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FileUpload;
