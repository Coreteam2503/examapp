import React, { useState } from 'react';
import { useAuth, useAuthDispatch, authActions } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminOverview from './AdminOverview';
import StudentManagement from './StudentManagement';
import SystemAnalytics from './SystemAnalytics';
import QuizManagement from './QuizManagement';
import UserRoles from './UserRoles';
import SystemSettings from './SystemSettings';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    authActions.logout(dispatch)();
    navigate('/login');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You need admin privileges to access this page.</p>
        <button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview />;
      case 'students':
        return <StudentManagement />;
      case 'analytics':
        return <SystemAnalytics />;
      case 'quizzes':
        return <QuizManagement />;
      case 'roles':
        return <UserRoles />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className={`admin-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="admin-content">
          <div className="admin-content-wrapper">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;