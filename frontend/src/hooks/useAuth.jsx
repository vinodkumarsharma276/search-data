import { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        const checkAuthStatus = () => {
            try {
                console.log('Checking auth status...'); // Debug log
                const authenticated = authService.isAuthenticated();
                console.log('Auth check result:', authenticated);
                setIsAuthenticated(authenticated);
            } catch (error) {
                console.error('Auth check error:', error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        // Initial auth check
        checkAuthStatus();

        // Listen for storage changes to update auth state
        const handleStorageChange = (e) => {
            // Only update if relevant keys changed
            if (e.key === 'user' || e.key === 'isAuthenticated') {
                checkAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array - only run once

    const refreshAuth = () => {
        try {
            const authenticated = authService.isAuthenticated();
            setIsAuthenticated(authenticated);
            return authenticated;
        } catch (error) {
            console.error('Auth refresh error:', error);
            setIsAuthenticated(false);
            return false;
        }
    };

    return { isAuthenticated, loading, refreshAuth };
};

export default useAuth;