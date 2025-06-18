import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/apiService';
import QuizTypeSelector from './quiz/QuizTypeSelector';
import './FileManager.css';

const FileManager = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(null); // Track which file is generating
  const [showQuizSelector, setShowQuizSelector] = useState(false);
  const [selectedFileForQuiz, setSelectedFileForQuiz] = useState(null);
  const { token } = useAuth();

  const fetchUploads = async (pageNum = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.uploads.list({ page: pageNum, limit: 10 });
      console.log('Uploads response structure:', response);
      
      const result = response.data;

      if (result.success && result.data) {
        setUploads(result.data.uploads || []);
        setPagination(result.data.pagination);
      } else if (result.uploads) {
        // Fallback for different response structure
        setUploads(result.uploads);
        setPagination(result.pagination);
      } else {
        setError(result.message || 'Failed to load uploads');
      }
    } catch (error) {
      console.error('Fetch uploads error:', error);
      const errorResponse = handleApiError(error);
      setError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads(page);
  }, [page, token]);

  const deleteUpload = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const response = await apiService.uploads.delete(id);
      const result = response.data;

      if (result.success) {
        // Refresh uploads list
        fetchUploads(page);
      } else {
        setError(result.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorResponse = handleApiError(error);
      setError(errorResponse.message);
    }
  };

  const generateQuiz = async (options, format = 'traditional') => {
    if (!selectedFileForQuiz) return;
    
    setGeneratingQuiz(selectedFileForQuiz.id);
    setError('');

    console.log('Starting quiz generation:', {
      format,
      options,
      fileId: selectedFileForQuiz.id,
      filename: selectedFileForQuiz.filename
    });

    try {
      let response;
      
      if (format === 'game') {
        console.log('Generating game format with options:', options);
        // Generate game format
        response = await apiService.games.generate({
          uploadId: selectedFileForQuiz.id,
          gameFormat: options.gameFormat,
          difficulty: options.difficulty,
          gameOptions: options.gameOptions
        });
        
        console.log('Game generation response:', response);
        
        if (response.data && (response.data.game || response.data.message)) {
          alert(`🎮 ${options.gameFormat.replace('_', ' ').toUpperCase()} game generated successfully!\nFile: "${selectedFileForQuiz.filename}"\nDifficulty: ${options.difficulty}\nReady to play!`);
        } else {
          throw new Error('Invalid game generation response format');
        }
      } else {
        console.log('Generating traditional quiz with options:', options);
        // Generate traditional quiz
        response = await apiService.quizzes.generateEnhanced({
          uploadId: selectedFileForQuiz.id,
          difficulty: options.difficulty,
          numQuestions: options.numQuestions,
          questionTypes: options.questionTypes,
          includeHints: options.includeHints || false
        });
        
        console.log('Quiz generation response:', response);
        
        if (response.data && response.data.quiz) {
          alert(`📝 Quiz generated successfully!\nFile: "${selectedFileForQuiz.filename}"\nQuestions: ${response.data.quiz.total_questions}\nDifficulty: ${options.difficulty}`);
        } else if (response.data && response.data.message) {
          alert(`✅ ${response.data.message}\nFile: "${selectedFileForQuiz.filename}"\nDifficulty: ${options.difficulty}`);
        } else {
          throw new Error('Invalid quiz generation response format');
        }
      }
      
      // Close selector
      setShowQuizSelector(false);
      setSelectedFileForQuiz(null);
      
    } catch (error) {
      console.error('Quiz/Game generation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorResponse = handleApiError(error);
      const errorMessage = `Failed to generate ${format === 'game' ? 'game' : 'quiz'} for "${selectedFileForQuiz.filename}":\n\n${errorResponse.message}`;
      
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const openQuizSelector = (upload) => {
    setSelectedFileForQuiz(upload);
    setShowQuizSelector(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType.includes('javascript') || fileType.includes('json')) return '📄';
    if (fileType.includes('python')) return '🐍';
    if (fileType.includes('java')) return '☕';
    if (fileType.includes('html')) return '🌐';
    if (fileType.includes('css')) return '🎨';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📝';
    return '📄';
  };

  if (loading && uploads.length === 0) {
    return (
      <div className="file-manager loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="manager-header">
        <h3>Your Uploaded Files</h3>
        <button onClick={() => fetchUploads(page)} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {uploads.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h4>No files uploaded yet</h4>
          <p>Upload your first file to get started with quiz generation!</p>
        </div>
      ) : (
        <>
          <div className="files-grid">
            {uploads.map((upload) => (
              <div key={upload.id} className="file-card">
                <div className="file-header">
                  <span className="file-icon">
                    {getFileTypeIcon(upload.file_type)}
                  </span>
                  <div className="file-actions">
                    <button
                      onClick={() => deleteUpload(upload.id, upload.filename)}
                      className="delete-btn"
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="file-details">
                  <h4 className="file-name" title={upload.filename}>
                    {upload.filename}
                  </h4>
                  <div className="file-meta">
                    <span className="file-size">
                      {formatFileSize(upload.file_size)}
                    </span>
                    <span className="upload-date">
                      {formatDate(upload.upload_date)}
                    </span>
                  </div>
                </div>

                <div className="file-footer">
                  <button 
                    className={`generate-quiz-btn ${generatingQuiz === upload.id ? 'generating' : ''}`}
                    disabled={generatingQuiz === upload.id}
                    onClick={() => openQuizSelector(upload)}
                  >
                    {generatingQuiz === upload.id ? (
                      <span>
                        <span className="spinner-small"></span>
                        Generating...
                      </span>
                    ) : (
                      '🎯 Generate Content'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="page-btn"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Quiz/Game Generation Selector */}
      {showQuizSelector && selectedFileForQuiz && (
        <div className="modal-overlay" onClick={() => setShowQuizSelector(false)}>
          <div className="quiz-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate Content for "{selectedFileForQuiz.filename}"</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowQuizSelector(false);
                  setSelectedFileForQuiz(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <QuizTypeSelector
                onGenerateQuiz={generateQuiz}
                isLoading={generatingQuiz === selectedFileForQuiz.id}
                preSelectedFile={selectedFileForQuiz.id}
              />
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default FileManager;