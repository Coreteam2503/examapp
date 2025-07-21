import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBatch } from '../../contexts/BatchContext';
import BatchSelector from '../common/BatchSelector';
import PerformanceStats from './PerformanceStats';
import RecentQuizzes from './RecentQuizzes';
import QuickActions from './QuickActions';
import { 
  ChartBarIcon, 
  ClockIcon, 
  AcademicCapIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { userBatches, loading: batchesLoading, fetchUserBatches } = useBatch();
  
  // State for batch filtering
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [showBatchFilter, setShowBatchFilter] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentQuizzes: [],
    batchSpecificData: {}
  });
  const [loading, setLoading] = useState(true);

  // Fetch user batches and dashboard data
  useEffect(() => {
    if (user?.id) {
      fetchUserBatches();
      fetchDashboardData();
    }
  }, [user?.id]);

  // Refetch data when batch selection changes
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [selectedBatches]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Construct query parameters for batch filtering
      const batchParams = selectedBatches.length > 0 
        ? `?batchIds=${selectedBatches.map(b => b.id).join(',')}`
        : '';

      // Fetch batch-filtered performance stats
      const statsPromise = fetch(`/api/analytics/performance${batchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }).then(res => res.ok ? res.json() : null);

      // Fetch batch-filtered recent quizzes
      const quizzesPromise = fetch(`/api/quiz-attempts/recent${batchParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }).then(res => res.ok ? res.json() : { data: [] });

      // Fetch batch-specific statistics if batches are selected
      let batchSpecificPromise = Promise.resolve({});
      if (selectedBatches.length > 0) {
        batchSpecificPromise = Promise.all(
          selectedBatches.map(batch => 
            fetch(`/api/batches/${batch.id}/statistics`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            }).then(res => res.ok ? res.json() : null)
              .then(data => ({ batchId: batch.id, batchName: batch.name, ...data }))
          )
        );
      }

      const [stats, quizzes, batchStats] = await Promise.all([
        statsPromise,
        quizzesPromise,
        batchSpecificPromise
      ]);

      setDashboardData({
        stats,
        recentQuizzes: quizzes.data || [],
        batchSpecificData: Array.isArray(batchStats) 
          ? batchStats.reduce((acc, stat) => ({ ...acc, [stat.batchId]: stat }), {})
          : {}
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data
      setDashboardData({
        stats: null,
        recentQuizzes: [],
        batchSpecificData: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFilterChange = (batches) => {
    setSelectedBatches(batches);
  };

  const handleTakeQuiz = (batchId = null) => {
    // Navigate to quiz generation with optional batch pre-selection
    const event = new CustomEvent('navigateToGenerate', { 
      detail: { preSelectedBatch: batchId } 
    });
    window.dispatchEvent(event);
  };

  const getFilteredBatchesDisplay = () => {
    if (selectedBatches.length === 0) {
      return 'All Batches';
    }
    if (selectedBatches.length === 1) {
      return selectedBatches[0].name;
    }
    return `${selectedBatches.length} Batches Selected`;
  };

  const renderBatchSpecificStats = () => {
    if (selectedBatches.length === 0 || Object.keys(dashboardData.batchSpecificData).length === 0) {
      return null;
    }

    return (
      <div className="batch-specific-stats">
        <h3>Batch Performance Overview</h3>
        <div className="batch-stats-grid">
          {selectedBatches.map(batch => {
            const stats = dashboardData.batchSpecificData[batch.id];
            if (!stats) return null;

            return (
              <div key={batch.id} className="batch-stat-card">
                <div className="batch-stat-header">
                  <h4>{batch.name}</h4>
                  <span className="batch-subject">{batch.subject}</span>
                </div>
                <div className="batch-stat-metrics">
                  <div className="metric">
                    <span className="metric-label">Questions Available</span>
                    <span className="metric-value">{stats.questionCount || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Your Quiz Attempts</span>
                    <span className="metric-value">{stats.userQuizAttempts || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Score</span>
                    <span className="metric-value">
                      {stats.userAverageScore ? `${stats.userAverageScore}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Best Score</span>
                    <span className="metric-value">
                      {stats.userBestScore ? `${stats.userBestScore}%` : 'N/A'}
                    </span>
                  </div>
                </div>
                <button 
                  className="batch-action-btn"
                  onClick={() => handleTakeQuiz(batch.id)}
                >
                  Take Quiz from {batch.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDashboardHeader = () => (
    <div className="dashboard-header">
      <div className="header-content">
        <h1>Student Dashboard</h1>
        <p>Track your learning progress across all your assigned batches</p>
      </div>
      
      {/* Batch Filter Controls */}
      <div className="dashboard-filters">
        <div className="filter-toggle">
          <button 
            className={`filter-btn ${showBatchFilter ? 'active' : ''}`}
            onClick={() => setShowBatchFilter(!showBatchFilter)}
          >
            <FunnelIcon className="filter-icon" />
            Filter by Batch
          </button>
          <span className="filter-status">{getFilteredBatchesDisplay()}</span>
        </div>
        
        {showBatchFilter && (
          <div className="batch-filter-panel">
            <BatchSelector
              batches={userBatches}
              selectedBatches={selectedBatches}
              onChange={handleBatchFilterChange}
              mode="multi"
              placeholder="Select batches to filter dashboard..."
              searchable={true}
              clearable={true}
              loading={batchesLoading}
              showBatchCounts={true}
              className="dashboard-batch-selector"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderQuickStats = () => (
    <div className="quick-stats">
      <div className="stat-card">
        <div className="stat-icon">
          <AcademicCapIcon />
        </div>
        <div className="stat-content">
          <span className="stat-value">{userBatches.length}</span>
          <span className="stat-label">Enrolled Batches</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">
          <ClockIcon />
        </div>
        <div className="stat-content">
          <span className="stat-value">{dashboardData.recentQuizzes.length}</span>
          <span className="stat-label">Recent Quizzes</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">
          <ChartBarIcon />
        </div>
        <div className="stat-content">
          <span className="stat-value">
            {dashboardData.recentQuizzes.length > 0 
              ? Math.round(dashboardData.recentQuizzes.reduce((acc, q) => acc + q.score, 0) / dashboardData.recentQuizzes.length)
              : 0}%
          </span>
          <span className="stat-label">Average Score</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="student-dashboard loading">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {renderDashboardHeader()}
      
      {renderQuickStats()}
      
      {/* Batch-Specific Statistics */}
      {renderBatchSpecificStats()}
      
      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-left">
          {/* Enhanced Performance Stats with batch filtering */}
          <PerformanceStats 
            selectedBatches={selectedBatches}
            refreshTrigger={selectedBatches}
          />
          
          {/* Quick Actions with batch context */}
          <QuickActions 
            selectedBatches={selectedBatches}
            onTakeQuiz={handleTakeQuiz}
          />
        </div>
        
        <div className="dashboard-right">
          {/* Enhanced Recent Quizzes with batch filtering */}
          <RecentQuizzes 
            selectedBatches={selectedBatches}
            onTakeQuiz={handleTakeQuiz}
            refreshTrigger={selectedBatches}
            showBatchInfo={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;