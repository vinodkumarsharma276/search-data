import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import SearchPage from './components/SearchPage.jsx';
import useAuth from './hooks/useAuth';
import './styles/App.css';

function App() {
  // Always call hooks in the same order - move useAuth to the top
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  // Use a different name to avoid confusion with authLoading
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setAppLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Show loading state while authentication is being checked
  if (authLoading || appLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  console.log('App render - isAuthenticated:', isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/search" replace /> : <Login />}
        />
        <Route 
          path="/search" 
          element={isAuthenticated ? <SearchPage /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/search" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;