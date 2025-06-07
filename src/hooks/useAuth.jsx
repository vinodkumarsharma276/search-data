import { useState, useEffect } from 'react';
import authService from '../services/authService';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAuth = () => {
        const authenticated = authService.isAuthenticated();
        console.log('Auth check result:', authenticated); // Debug log
        setIsAuthenticated(authenticated);
        setLoading(false);
        return authenticated;
    };

    useEffect(() => {
        checkAuth();

        // Listen for storage changes to update auth state
        const handleStorageChange = () => {
            checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const refreshAuth = () => {
        return checkAuth();
    };

    return { isAuthenticated, loading, refreshAuth };
};

export default useAuth;