import React, { useState, useEffect } from 'react';
import { useAuth, useAuthDispatch, authActions } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuizManager from './quiz/QuizManager';
import './Dashboard.css';

// Import new dashboard components
import ProgressTracker from './dashboard/ProgressTracker';
import RecentQuizzes from './dashboard/RecentQuizzes';
import PerformanceStats from './dashboard/PerformanceStats';
// import QuickActions from './dashboard/QuickActions';
import StudentBatchDisplay from './dashboard/StudentBatchDisplay';
import StudentDashboard from './dashboard/StudentDashboard';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to enhanced dashboard tab
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

    const handleNavigateToGenerate = () => {
      console.log('Received navigateToGenerate event, switching to generate tab');
      setActiveTab('generate');
      setMobileMenuOpen(false);
    };

    window.addEventListener('navigateToQuizzes', handleNavigateToQuizzes);
    window.addEventListener('navigateToGenerate', handleNavigateToGenerate);
    
    return () => {
      window.removeEventListener('navigateToQuizzes', handleNavigateToQuizzes);
      window.removeEventListener('navigateToGenerate', handleNavigateToGenerate);
    };
  }, []);

  const handleLogout = () => {
    authActions.logout(dispatch)();
    navigate('/login');
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
            {user?.role === 'admin' && (
              <>
                <span className="role-badge">{user?.role}</span>
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
              </>
            )}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className={`dashboard-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-content">
          {user?.role === 'student' && (
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            >
              Dashboard
            </button>
          )}
          <button 
            className={`nav-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('quizzes'); setMobileMenuOpen(false); }}
          >
            My Quizzes
          </button>
          {user?.role === 'student' && (
            <button 
              className={`nav-btn ${activeTab === 'batches' ? 'active' : ''}`}
              onClick={() => { setActiveTab('batches'); setMobileMenuOpen(false); }}
            >
              My Batches
            </button>
          )}
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'dashboard' && user?.role === 'student' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Dashboard</h2>
                <p>Track your learning progress and get quick access to your activities.</p>
              </div>
              <StudentDashboard />
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="tab-content">
              <QuizManager onQuizCompleted={handleQuizCompleted} />
            </div>
          )}

          {activeTab === 'batches' && user?.role === 'student' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>My Batches</h2>
                <p>View and manage your assigned learning batches and track your progress.</p>
              </div>
              <StudentBatchDisplay />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;