import React from 'react';
import './QuickActions.css';

const QuickActions = ({ 
  setActiveTab, 
  user, 
  selectedBatches = []
}) => {
  const quickActions = [
    {
      icon: '🧠',
      title: 'Take Random Quiz',
      description: 'Test your knowledge',
      action: () => setActiveTab('quizzes'),
      color: '#2ecc71',
      enabled: true
    }
  ];

  // Add admin actions if user is admin
  if (user?.role === 'admin') {
    quickActions.push({
      icon: '⚙',
      title: 'Admin Panel',
      description: 'Manage users and system',
      action: () => window.location.href = '/admin',
      color: '#e74c3c',
      enabled: true // Admin features are now implemented
    });
  }

  const handleActionClick = (action) => {
    if (action.enabled) {
      action.action();
    }
  };

  return (
    <div className="quick-actions">
      <div className="section-header">
        <h3>Quick Actions</h3>
        <span className="section-subtitle">Jump to what you need</span>
      </div>
      
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className={`quick-action-card ${!action.enabled ? 'disabled' : ''}`}
            onClick={() => handleActionClick(action)}
            disabled={!action.enabled}
            style={{ 
              borderLeftColor: action.color,
              '--hover-color': action.color 
            }}
          >
            <div className="action-icon" style={{ backgroundColor: action.color }}>
              {action.icon}
            </div>
            <div className="action-content">
              <h4>{action.title}</h4>
              <p>{action.description}</p>
              {!action.enabled && (
                <span className="coming-soon-badge">Coming Soon</span>
              )}
            </div>
            <div className="action-arrow">
              {action.enabled ? '→' : '⏳'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;