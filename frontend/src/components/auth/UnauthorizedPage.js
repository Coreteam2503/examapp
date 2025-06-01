import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>403 - Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <p>Please contact your administrator if you believe this is an error.</p>
        <div className="actions">
          <Link to="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .unauthorized-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f5f5f5;
        }
        .unauthorized-content {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
          margin: 0 auto;
        }
        h1 {
          color: #e74c3c;
          margin-bottom: 1rem;
          font-size: 2.5rem;
        }
        p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-primary {
          background-color: #3498db;
          color: white;
        }
        .btn-primary:hover {
          background-color: #2980b9;
        }
        .btn-secondary {
          background-color: #95a5a6;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #7f8c8d;
        }
      `}</style>
    </div>
  );
};

export default UnauthorizedPage;
