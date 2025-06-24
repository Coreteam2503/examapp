import React, { useState, useEffect } from 'react';
import { useAuth, useAuthDispatch, authActions } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import FileManager from './FileManager';
import QuizManager from './quiz/QuizManager';
import './Dashboard.css';

// Import new dashboard components
import ProgressTracker from './dashboard/ProgressTracker';
import RecentQuizzes from './dashboard/RecentQuizzes';
import PerformanceStats from './dashboard/PerformanceStats';
import QuickActions from './dashboard/QuickActions';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quizzes'); // Changed default from 'overview' to 'quizzes'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Additional auth check - redirect if not authenticated and not loading
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('Dashboard: User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Listen for navigation events from game components
  useEffect(() => {
    const handleNavigateToQuizzes = () => {
      console.log('Received navigateToQuizzes event, switching to quizzes tab');
      setActiveTab('quizzes');
      setMobileMenuOpen(false);
    };

    window.addEventListener('navigateToQuizzes', handleNavigateToQuizzes);
    
    return () => {
      window.removeEventListener('navigateToQuizzes', handleNavigateToQuizzes);
    };
  }, []);

  const handleLogout = () => {
    authActions.logout(dispatch)();
    navigate('/login');
  };

  const handleUploadSuccess = (uploadedFiles) => {
    // Refresh file manager if it's active
    if (activeTab === 'files') {
      // FileManager will handle the refresh
      setActiveTab('files');
    } else {
      // Switch to files tab to show uploaded files
      setActiveTab('files');
    }
  };

  const handleTakeQuiz = (quizId = null) => {
    setActiveTab('quizzes');
    // If quizId is provided, could pass it to QuizManager to start specific quiz
  };

  const handleQuizCompleted = () => {
    // Trigger refresh of dashboard data when a quiz is completed
    console.log('Quiz completed, refreshing dashboard data');
    setDashboardRefreshTrigger(prev => prev + 1);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  // This should not render if not authenticated due to useEffect redirect above
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <h1>Quiz Learning Platform</h1>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.email}</span>
            <span className="role-badge">{user?.role}</span>
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')} 
                className="admin-btn"
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontSize: '14px'
                }}
              >
                Admin
              </button>
            )}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className={`dashboard-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-content">
          <button 
            className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }}
          >
            Upload Files
          </button>
          <button 
            className={`nav-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => { setActiveTab('files'); setMobileMenuOpen(false); }}
          >
            My Files
          </button>
          <button 
            className={`nav-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('quizzes'); setMobileMenuOpen(false); }}
          >
            Your Quizzes
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'upload' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Upload Files</h2>
                <p>Upload your code files, documents, or text files to generate quizzes.</p>
              </div>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>File Manager</h2>
                <p>View, manage, and generate quizzes from your uploaded files.</p>
              </div>
              <FileManager />
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Your Quizzes</h2>
                <p>Take quizzes based on your uploaded content and track your progress.</p>
              </div>
              <QuizManager onQuizCompleted={handleQuizCompleted} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
