import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBatch } from '../../contexts/BatchContext';
// import PerformanceStats from './PerformanceStats';
// import RecentQuizzes from './RecentQuizzes';
import QuickActions from './QuickActions';
import { 
  ChartBarIcon, 
  ClockIcon, 
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { userBatches, loading: batchesLoading, fetchUserBatches } = useBatch();
  const [loading, setLoading] = useState(true);

  // Fetch user batches
  useEffect(() => {
    if (user?.id) {
      fetchUserBatches();
      setLoading(false);
    }
  }, [user?.id]);

  const renderQuickStats = () => (
    <div className="stats-grid">
      <div className="stat-card quizzes">
        <div className="stat-header">
          <ClockIcon className="stat-icon" />
          <span className="stat-label">Recent Quizzes</span>
        </div>
        <div className="stat-value">0</div>
      </div>
      
      <div className="stat-card performance">
        <div className="stat-header">
          <ChartBarIcon className="stat-icon" />
          <span className="stat-label">Average Score</span>
        </div>
        <div className="stat-value">0%</div>
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
      {renderQuickStats()}
      
      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-left">
          <QuickActions 
            onNavigateToQuizzes={() => {
              // Navigate to Your Quizzes tab in parent Dashboard
              window.dispatchEvent(new CustomEvent('navigateToQuizzes'));
            }}
          />
        </div>
        
        <div className="dashboard-right">
          {/* Space for future components */}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;