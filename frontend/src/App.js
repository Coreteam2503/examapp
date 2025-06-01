import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute, RoleBasedRoute } from './components/auth/ProtectedRoute';
import UnauthorizedPage from './components/auth/UnauthorizedPage';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - redirect to dashboard if already authenticated */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              } 
            />

            {/* Protected routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin-only routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminRoutes />
                </ProtectedRoute>
              } 
            />

            {/* Role-based routes example */}
            <Route 
              path="/teacher/*" 
              element={
                <RoleBasedRoute allowedRoles={['admin', 'teacher']}>
                  <TeacherRoutes />
                </RoleBasedRoute>
              } 
            />

            {/* Error routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Placeholder components for future implementation
const AdminRoutes = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🔧 Admin Panel</h2>
    <p>Admin routes will be implemented in future tasks.</p>
    <p>You have admin access!</p>
  </div>
);

const TeacherRoutes = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>👨‍🏫 Teacher Dashboard</h2>
    <p>Teacher routes will be implemented in future tasks.</p>
    <p>You have teacher or admin access!</p>
  </div>
);

export default App;
