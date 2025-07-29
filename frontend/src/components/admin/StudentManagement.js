import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../../services/apiService';
import { useBatch } from '../../contexts/BatchContext';
import BatchSelector from '../common/BatchSelector';
import axios from 'axios';
import './StudentManagement.css';

const StudentManagement = () => {
  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = (method, url, data = null) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const config = {
      method,
      url: `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}${url}`,
      headers,
      ...(data && { data })
    };
    
    return axios(config);
  };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBatchManageModal, setShowBatchManageModal] = useState(false);
  const [studentCurrentBatches, setStudentCurrentBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  
  // Batch context
  const { batches, fetchBatches } = useBatch();

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, [currentPage, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.admin.getStudents({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });
      
      if (response.data.success) {
        setStudents(response.data.data.students);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to fetch students');
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      console.error('Error fetching students:', errorInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (studentId, currentStatus) => {
    try {
      const response = await apiService.admin.updateStudentStatus(studentId, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        // Update local state
        setStudents(students.map(student => 
          student.id === studentId 
            ? { ...student, is_active: !currentStatus }
            : student
        ));
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      alert(`Failed to update student status: ${errorInfo.message}`);
    }
  };

  const handleViewDetails = async (studentId) => {
    try {
      const response = await apiService.admin.getStudentDetails(studentId);
      if (response.data.success) {
        setSelectedStudent(response.data.data);
        setShowDetails(true);
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      alert(`Failed to fetch student details: ${errorInfo.message}`);
    }
  };

  const handleBatchManagement = async (student) => {
    try {
      setBatchActionLoading(true);
      setSelectedStudent(student);
      
      // Fetch student's current batches
      const response = await apiService.admin.getStudentDetails(student.id);
      if (response.data.success) {
        const currentBatches = response.data.data.studentBatches || [];
        setStudentCurrentBatches(currentBatches);
        
        // Get available batches (all batches minus current ones)
        const currentBatchIds = currentBatches.map(batch => batch.id);
        const available = batches.filter(batch => !currentBatchIds.includes(batch.id));
        setAvailableBatches(available);
        
        setShowBatchManageModal(true);
      }
    } catch (error) {
      console.error('Error fetching student batch data:', error);
      alert(`Failed to load batch data: ${error.message}`);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleAddStudentToBatch = async (batchId) => {
    try {
      setBatchActionLoading(true);
      
      // Use the authenticated request helper
      const response = await makeAuthenticatedRequest('POST', `/batches/${batchId}/users`, {
        userId: selectedStudent.id
      });
      
      if (response.data.success) {
        // Refresh the batch data
        await handleBatchManagement(selectedStudent);
        // Refresh students list to update any counts
        await fetchStudents();
        console.log('✅ Student successfully added to batch');
      } else {
        throw new Error(response.data.message || 'Failed to add student to batch');
      }
    } catch (error) {
      console.error('Error adding student to batch:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Failed to add student to batch: ${errorMessage}`);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleRemoveStudentFromBatch = async (batchId) => {
    try {
      setBatchActionLoading(true);
      
      // Use the authenticated request helper
      const response = await makeAuthenticatedRequest('DELETE', `/batches/${batchId}/users/${selectedStudent.id}`);
      
      if (response.data.success) {
        // Refresh the batch data
        await handleBatchManagement(selectedStudent);
        // Refresh students list to update any counts
        await fetchStudents();
        console.log('✅ Student successfully removed from batch');
      } else {
        throw new Error(response.data.message || 'Failed to remove student from batch');
      }
    } catch (error) {
      console.error('Error removing student from batch:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Failed to remove student from batch: ${errorMessage}`);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Student Management</h1>
        <p>Manage student accounts, monitor activity, and track performance</p>
      </div>
      
      {/* Search and Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search students by email or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="search-input"
          />
          <button onClick={fetchStudents} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">Loading students...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-message">❌ {error}</div>
          <button onClick={fetchStudents} className="retry-btn">Try Again</button>
        </div>
      )}

      {/* Students Table */}
      {!loading && !error && (
        <>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Quiz Stats</th>
                  <th>Avg Score</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {(student.first_name || student.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="student-details">
                          <div className="student-name">
                            {student.first_name || student.last_name 
                              ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                              : 'No name set'
                            }
                          </div>
                          <div className="student-id">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>
                      <div className="quiz-stats">
                        <span>{student.statistics.totalAttempts} attempts</span>
                        <span>{student.statistics.uniqueQuizzes} quizzes</span>
                      </div>
                    </td>
                    <td>
                      <span className={`score-badge ${
                        student.statistics.averageScore >= 80 ? 'excellent' :
                        student.statistics.averageScore >= 70 ? 'good' :
                        student.statistics.averageScore >= 60 ? 'average' : 'needs-improvement'
                      }`}>
                        {student.statistics.averageScore}%
                      </span>
                    </td>
                    <td>{formatLastActivity(student.statistics.lastActivity)}</td>
                    <td>
                      <span className={`status-badge ${
                        student.is_active ? 'active' : 'inactive'
                      }`}>
                        {student.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleViewDetails(student.id)}
                          className="view-btn"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => handleBatchManagement(student)}
                          className="batch-btn"
                          title="Manage Student Batches"
                          disabled={batchActionLoading}
                        >
                          📚
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(student.id, student.is_active)}
                          className={`toggle-btn ${student.is_active ? 'deactivate' : 'activate'}`}
                          title={student.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {student.is_active ? '⏸️' : '▶️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {pagination.totalPages} 
                ({pagination.totalStudents} total students)
              </span>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Student Details Modal */}
      {showDetails && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button 
                onClick={() => setShowDetails(false)} 
                className="close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="student-detail-info">
                <h3>{selectedStudent.student.email}</h3>
                <p>Name: {selectedStudent.student.firstName || selectedStudent.student.lastName 
                  ? `${selectedStudent.student.firstName || ''} ${selectedStudent.student.lastName || ''}`.trim()
                  : 'Not set'
                }</p>
                <p>Member since: {formatDate(selectedStudent.student.createdAt)}</p>
                <p>Status: {selectedStudent.student.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-value">{selectedStudent.performanceMetrics.totalAttempts}</span>
                    <span className="metric-label">Total Attempts</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{selectedStudent.performanceMetrics.averageScore}%</span>
                    <span className="metric-label">Average Score</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{selectedStudent.performanceMetrics.consistencyScore}%</span>
                    <span className="metric-label">Consistency</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{selectedStudent.performanceMetrics.lastSevenDaysActivity}</span>
                    <span className="metric-label">Recent Activity</span>
                  </div>
                </div>
              </div>
              
              {selectedStudent.quizHistory.length > 0 && (
                <div className="quiz-history">
                  <h4>Recent Quiz History</h4>
                  <div className="quiz-history-list">
                    {selectedStudent.quizHistory.slice(0, 5).map((quiz, index) => (
                      <div key={index} className="quiz-history-item">
                        <div className="quiz-info">
                          <span className="quiz-title">{quiz.quiz_title || 'Untitled Quiz'}</span>
                          <span className="quiz-date">{formatDate(quiz.completed_at)}</span>
                        </div>
                        <div className="quiz-score">
                          <span className={`score ${
                            quiz.score_percentage >= 80 ? 'excellent' :
                            quiz.score_percentage >= 70 ? 'good' :
                            quiz.score_percentage >= 60 ? 'average' : 'needs-improvement'
                          }`}>
                            {quiz.score_percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Management Modal */}
      {showBatchManageModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowBatchManageModal(false)}>
          <div className="modal-content batch-manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Batches for {selectedStudent.email}</h2>
              <button 
                onClick={() => setShowBatchManageModal(false)} 
                className="close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {batchActionLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner">Updating...</div>
                </div>
              )}
              
              {/* Current Batches Section */}
              <div className="batch-section">
                <h3>Current Batches ({studentCurrentBatches.length})</h3>
                {studentCurrentBatches.length > 0 ? (
                  <div className="current-batches-list">
                    {studentCurrentBatches.map(batch => (
                      <div key={batch.id} className="batch-item current-batch">
                        <div className="batch-info">
                          <div className="batch-name">{batch.name}</div>
                          <div className="batch-meta">
                            <span className="batch-subject">{batch.subject}</span>
                            <span className="batch-domain">{batch.domain}</span>
                            <span className="enrolled-date">
                              Enrolled: {formatDate(batch.enrolled_at)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudentFromBatch(batch.id)}
                          className="remove-batch-btn"
                          disabled={batchActionLoading}
                          title="Remove student from this batch"
                        >
                          ❌ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Student is not enrolled in any batches.</p>
                  </div>
                )}
              </div>

              {/* Available Batches Section */}
              <div className="batch-section">
                <h3>Add to Batches ({availableBatches.length} available)</h3>
                {availableBatches.length > 0 ? (
                  <div className="available-batches-list">
                    {availableBatches.map(batch => (
                      <div key={batch.id} className="batch-item available-batch">
                        <div className="batch-info">
                          <div className="batch-name">{batch.name}</div>
                          <div className="batch-meta">
                            <span className="batch-subject">{batch.subject}</span>
                            <span className="batch-domain">{batch.domain}</span>
                            {batch.description && (
                              <span className="batch-description">{batch.description}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddStudentToBatch(batch.id)}
                          className="add-batch-btn"
                          disabled={batchActionLoading}
                          title="Add student to this batch"
                        >
                          ➕ Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Student is already enrolled in all available batches.</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => setShowBatchManageModal(false)}
                  className="close-modal-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;