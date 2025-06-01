import React, { useState } from 'react';
import { useAuth, useAuthDispatch, authActions } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import FileManager from './FileManager';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Quiz Learning Platform</h1>
          <div className="user-info">
            <span>Welcome, {user?.email}</span>
            <span className="role-badge">{user?.role}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="nav-content">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Upload Files
          </button>
          <button 
            className={`nav-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📋 My Files
          </button>
          <button 
            className={`nav-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
            disabled
          >
            🧠 Quizzes (Soon)
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              <div className="welcome-section">
                <h2>Welcome to your Dashboard!</h2>
                <p>Upload files and generate intelligent quizzes to enhance your learning.</p>
              </div>

              <div className="features-grid">
                <div className="feature-card clickable" onClick={() => setActiveTab('upload')}>
                  <h3>📁 File Upload</h3>
                  <p>Upload your code files to generate quizzes</p>
                  <button className="feature-btn active">
                    Start Uploading
                  </button>
                </div>

                <div className="feature-card clickable" onClick={() => setActiveTab('files')}>
                  <h3>📋 File Manager</h3>
                  <p>View and manage your uploaded files</p>
                  <button className="feature-btn active">
                    View Files
                  </button>
                </div>

                <div className="feature-card">
                  <h3>🧠 AI Quiz Generation</h3>
                  <p>Generate intelligent quizzes from your content</p>
                  <button className="feature-btn" disabled>
                    Coming Soon
                  </button>
                </div>

                <div className="feature-card">
                  <h3>📊 Analytics</h3>
                  <p>Track your learning progress and performance</p>
                  <button className="feature-btn" disabled>
                    Coming Soon
                  </button>
                </div>

                {user?.role === 'admin' && (
                  <div className="feature-card admin-card">
                    <h3>⚙️ Admin Panel</h3>
                    <p>Manage users and system settings</p>
                    <button className="feature-btn" disabled>
                      Coming Soon
                    </button>
                  </div>
                )}
              </div>

              <div className="user-details">
                <h3>Your Account Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Email:</strong> {user?.email}
                  </div>
                  <div className="detail-item">
                    <strong>Role:</strong> {user?.role}
                  </div>
                  <div className="detail-item">
                    <strong>User ID:</strong> {user?.id}
                  </div>
                </div>
              </div>
            </>
          )}

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
                <h2>Quiz Center</h2>
                <p>Generate and take quizzes based on your uploaded content.</p>
              </div>
              <div className="coming-soon">
                <div className="coming-soon-icon">🚀</div>
                <h3>Quiz Generation Coming Soon!</h3>
                <p>We're working hard to bring you AI-powered quiz generation. Upload your files now to be ready!</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .role-badge {
          background: rgba(255,255,255,0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .dashboard-nav {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 1rem 0;
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .nav-btn {
          background: none;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
          color: #6c757d;
        }

        .nav-btn:hover:not(:disabled) {
          background: #f8f9fa;
          color: #495057;
        }

        .nav-btn.active {
          background: #3498db;
          color: white;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dashboard-main {
          padding: 2rem 0;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tab-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .tab-header h2 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 2rem;
        }

        .tab-header p {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .welcome-section h2 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 2rem;
        }

        .welcome-section p {
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .feature-card.clickable {
          cursor: pointer;
        }

        .feature-card.clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .admin-card {
          border: 2px solid #e74c3c;
          background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
        }

        .feature-card h3 {
          margin-bottom: 1rem;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .feature-card p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .feature-btn {
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .feature-btn.active {
          background: #3498db;
          color: white;
          cursor: pointer;
        }

        .feature-btn.active:hover {
          background: #2980b9;
        }

        .feature-btn:disabled {
          background: #95a5a6;
          color: white;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .user-details {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .user-details h3 {
          margin-bottom: 1.5rem;
          color: #2c3e50;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 0.5rem;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #3498db;
        }

        .detail-item strong {
          color: #2c3e50;
        }

        .coming-soon {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .coming-soon-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .coming-soon h3 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .coming-soon p {
          color: #7f8c8d;
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .header-content {
            text-align: center;
          }
          
          .header-content h1 {
            font-size: 1.4rem;
          }
          
          .dashboard-content {
            padding: 0 1rem;
          }
          
          .nav-content {
            padding: 0 1rem;
            justify-content: center;
          }
          
          .nav-btn {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }
          
          .welcome-section h2, .tab-header h2 {
            font-size: 1.6rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
