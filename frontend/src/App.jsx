import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './components/Login.jsx';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import authService from './services/authService';
import './styles/App.css';
import './styles/themes.css';
import { useTheme } from './contexts/ThemeContext.jsx';

let appRenderCount = 0;

function App() {
    const { theme } = useTheme();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const hasInitialized = useRef(false);

    // Increment render counter
    appRenderCount++;
    console.log(`🏠 App component render #${appRenderCount}`, { isAuthenticated, loading });

    useEffect(() => {
        console.log("📋 App useEffect - hasInitialized.current:", hasInitialized.current);
        if (hasInitialized.current) {
            console.log("⛔ App useEffect - Already initialized, returning early");
            return;
        }
        hasInitialized.current = true;

        console.log("✅ App useEffect - First initialization, proceeding...");

        const checkAuth = () => {
            try {
                const authenticated = authService.isAuthenticated();
                console.log('🔍 App: Initial auth check result:', authenticated);
                setIsAuthenticated(authenticated);
            } catch (error) {
                console.error('💥 App: Auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                console.log('⏰ App: Setting loading to false');
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for authentication changes in localStorage
        const handleStorageChange = (e) => {
            if (e.key === 'user' || e.key === 'isAuthenticated') {
                console.log('🔄 Storage change detected, rechecking auth');
                const authenticated = authService.isAuthenticated();
                console.log('🔍 New auth state:', authenticated);
                setIsAuthenticated(authenticated);
            }
        };

        // Listen for custom auth events
        const handleAuthChange = () => {
            console.log('🔄 Auth change event detected');
            const authenticated = authService.isAuthenticated();
            console.log('🔍 New auth state:', authenticated);
            setIsAuthenticated(authenticated);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authStateChanged', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', handleAuthChange);
        };
    }, []);

    console.log('🎭 App render state:', { loading, isAuthenticated });

    if (loading) {
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

    return (
        <Router>
            <Layout style={{ minHeight: '100vh' }} className={`theme-${theme}`}>
                <Header />
                <Routes>
                        <Route 
                            path="/login" 
                            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
                        />
                        <Route 
                            path="/dashboard/*" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/add-sale" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search-sale" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/add-distributor" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search-distributor" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/add-product" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search-product" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/add-customer" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search-customer" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/add-employee" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search-employee" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/search" 
                            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
                        />
                        <Route 
                            path="/" 
                            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
                        />
                    </Routes>
            </Layout>
        </Router>
    );
}

export default App;