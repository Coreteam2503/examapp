import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Simple version for debugging
const StudentDashboard = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    setDebugInfo(`User loaded: ${user ? 'Yes' : 'No'}, ID: ${user?.id || 'None'}`);
  }, [user]);

  // Try to import BatchContext only after checking if it's available
  let BatchContext;
  let useBatch;
  try {
    const batchContextModule = require('../../contexts/BatchContext');
    useBatch = batchContextModule.useBatch;
    BatchContext = batchContextModule.default;
  } catch (error) {
    console.error('Error importing BatchContext:', error);
    return (
      <div className="student-dashboard">
        <h1>Student Dashboard</h1>
        <div style={{ 
          padding: '20px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>⚠️ BatchContext Error</h3>
          <p>There was an error loading the BatchContext. Please make sure:</p>
          <ul>
            <li>The BatchProvider is properly wrapped around the app</li>
            <li>The page has been refreshed after the changes</li>
            <li>All imports are correct</li>
          </ul>
          <p><strong>Debug Info:</strong> {debugInfo}</p>
          <button onClick={() => window.location.reload()}>
            🔄 Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Now try to use the context
  let batchContext;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    batchContext = useBatch();
  } catch (error) {
    console.error('Error using BatchContext:', error);
    return (
      <div className="student-dashboard">
        <h1>Student Dashboard</h1>
        <div style={{ 
          padding: '20px', 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>❌ BatchProvider Not Found</h3>
          <p>The BatchProvider is not properly set up. This usually means:</p>
          <ol>
            <li>The App.js doesn't include the BatchProvider wrapper</li>
            <li>The page needs to be refreshed</li>
            <li>There's a circular dependency issue</li>
          </ol>
          <p><strong>Debug Info:</strong> {debugInfo}</p>
          <p><strong>Error:</strong> {error.message}</p>
          <button onClick={() => window.location.reload()}>
            🔄 Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If we get here, the context is working
  const { userBatches, loading, error } = batchContext;

  return (
    <div className="student-dashboard">
      <h1>✅ Student Dashboard</h1>
      <div style={{ 
        padding: '20px', 
        background: '#d1ecf1', 
        border: '1px solid #bee5eb', 
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>🎉 BatchContext Working!</h3>
        <p>The BatchContext has been successfully loaded and is working.</p>
        <p><strong>Debug Info:</strong> {debugInfo}</p>
        <p><strong>User Batches:</strong> {loading ? 'Loading...' : userBatches?.length || 0}</p>
        {error && <p><strong>Error:</strong> {error}</p>}
        <button onClick={() => window.location.reload()}>
          🔄 Refresh Page to Load Full Dashboard
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;