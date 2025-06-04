import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../../services/apiService';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchStudents();
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
    </div>
  );
};

export default StudentManagement;