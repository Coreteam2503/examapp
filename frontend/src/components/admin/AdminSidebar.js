import React from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({ activeSection, setActiveSection, collapsed, setCollapsed }) => {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      description: 'System overview and key metrics'
    },
    {
      id: 'students',
      label: 'Students',
      icon: '👥',
      description: 'Manage student accounts and activity'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Performance analytics and reporting'
    },
    {
      id: 'quizzes',
      label: 'Quiz Management',
      icon: '📝',
      description: 'Manage quizzes and content'
    },
    {
      id: 'roles',
      label: 'User Roles',
      icon: '🔐',
      description: 'Manage user permissions and roles'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'System configuration and settings'
    }
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">🎓</div>
          {!collapsed && (
            <div className="logo-text">
              <h3>Admin Panel</h3>
              <span>Quiz Platform</span>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                title={collapsed ? item.label : item.description}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-badge">
              <span className="badge-icon">👑</span>
              <span className="badge-text">Administrator</span>
            </div>
            <p className="admin-note">
              You have full system access and permissions.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;