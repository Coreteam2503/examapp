import React, { useState, useEffect } from 'react';
import './AdminHeader.css';

const AdminHeader = ({ user, onLogout, onToggleSidebar, sidebarCollapsed }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="hamburger">☰</span>
        </button>
        
        <div className="breadcrumb">
          <span className="breadcrumb-item">Admin</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">Dashboard</span>
        </div>
      </div>

      <div className="header-center">
        <div className="system-status">
          <div className="status-indicator online">
            <span className="status-dot"></span>
            <span className="status-text">System Online</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="datetime-display">
          <div className="time">{formatTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>

        <div className="header-actions">
          <button className="action-btn notifications">
            <span className="action-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>

          <button className="action-btn settings">
            <span className="action-icon">⚙️</span>
          </button>

          <div className="user-menu-container">
            <button 
              className="user-menu-toggle"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <span className="avatar-text">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="user-info">
                <span className="user-name">{user?.email}</span>
                <span className="user-role">Administrator</span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-details">
                    <div className="user-email">{user?.email}</div>
                    <div className="user-role-badge">Admin Access</div>
                  </div>
                </div>
                
                <div className="dropdown-menu">
                  <button className="dropdown-item">
                    <span className="item-icon">👤</span>
                    <span className="item-text">Profile Settings</span>
                  </button>
                  
                  <button className="dropdown-item">
                    <span className="item-icon">🔒</span>
                    <span className="item-text">Security</span>
                  </button>
                  
                  <button className="dropdown-item">
                    <span className="item-icon">🎨</span>
                    <span className="item-text">Preferences</span>
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item" onClick={() => window.location.href = '/dashboard'}>
                    <span className="item-icon">📚</span>
                    <span className="item-text">Student Dashboard</span>
                  </button>
                  
                  <button className="dropdown-item logout" onClick={onLogout}>
                    <span className="item-icon">🚪</span>
                    <span className="item-text">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;