import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/apiService';

const FileManager = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(null); // Track which file is generating
  const { token } = useAuth();

  const fetchUploads = async (pageNum = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.uploads.list({ page: pageNum, limit: 10 });
      const result = response.data;

      if (result.success) {
        setUploads(result.data.uploads);
        setPagination(result.data.pagination);
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

  const generateQuiz = async (uploadId, filename) => {
    setGeneratingQuiz(uploadId);
    setError('');

    try {
      const response = await apiService.quizzes.generate({
        uploadId: uploadId,
        difficulty: 'medium',
        numQuestions: 5
      });

      if (response.data && response.data.quiz) {
        // Quiz generated successfully
        alert(`Quiz generated successfully for "${filename}"!\nQuiz ID: ${response.data.quiz.id}\nQuestions: ${response.data.quiz.total_questions}`);
        
        // You can redirect to quiz page or show success message
        // window.location.href = `/quiz/${response.data.quiz.id}`;
      } else {
        setError('Quiz generated but response format unexpected');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      const errorResponse = handleApiError(error);
      setError(`Failed to generate quiz for "${filename}": ${errorResponse.message}`);
    } finally {
      setGeneratingQuiz(null);
    }
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
                    onClick={() => generateQuiz(upload.id, upload.filename)}
                  >
                    {generatingQuiz === upload.id ? (
                      <span>
                        <span className="spinner-small"></span>
                        Generating Quiz...
                      </span>
                    ) : (
                      '🎯 Generate Quiz'
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

      <style jsx>{`
        .file-manager {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .file-manager.loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .spinner-small {
          display: inline-block;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #fff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #ecf0f1;
        }

        .manager-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .refresh-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #e9ecef;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #7f8c8d;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .file-card {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          transition: all 0.2s;
          background: #fafafa;
        }

        .file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: #fee;
        }

        .file-details {
          margin-bottom: 1rem;
        }

        .file-name {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 600;
          word-break: break-word;
          line-height: 1.3;
        }

        .file-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-size, .upload-date {
          font-size: 0.875rem;
          color: #7f8c8d;
        }

        .file-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
        }

        .generate-quiz-btn {
          width: 100%;
          background: #27ae60;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .generate-quiz-btn:hover:not(:disabled) {
          background: #219a52;
          transform: translateY(-1px);
        }

        .generate-quiz-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .generate-quiz-btn.generating {
          background: #f39c12;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          padding-top: 2rem;
          border-top: 1px solid #ecf0f1;
        }

        .page-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: #2980b9;
        }

        .page-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .page-info {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .file-manager {
            padding: 1rem;
          }

          .manager-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .files-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .pagination {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FileManager;