import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { authService } from './services/authService';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();
        setUser(userData);
        setCurrentView('dashboard');
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleRegistrationSuccess = (userData) => {
    // After registration, switch to login view
    setCurrentView('login');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentView('login');
  };

  const switchToRegister = () => {
    setCurrentView('register');
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple Dashboard component
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Agentic Mesh Quiz App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.first_name || user?.email}!
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Authentication Working!
              </h2>
              <p className="text-gray-600 mb-6">
                You have successfully logged in. The authentication system is fully functional.
              </p>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                <div className="space-y-2 text-left">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                  <p><strong>Status:</strong> {user?.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Member Since:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Render appropriate view
  switch (currentView) {
    case 'register':
      return (
        <RegisterForm
          onRegistrationSuccess={handleRegistrationSuccess}
          onSwitchToLogin={switchToLogin}
        />
      );
    case 'dashboard':
      return <Dashboard />;
    case 'login':
    default:
      return (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={switchToRegister}
        />
      );
  }
}

export default App;
