import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiry
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            authService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    async login(username, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                username,
                password
            });

            if (response.data.success) {
                const { token, user } = response.data.data;
                
                // Store token and user info
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                console.log('🎉 Login successful, dispatching event');
                
                // Dispatch custom event to notify App component
                window.dispatchEvent(new CustomEvent('authStateChanged'));
                
                return { success: true, user };
            }
            
            return { success: false, error: response.data.error };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    },
    
    logout() {
        // Remove auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        console.log('🚪 Logout completed, dispatching event');
        
        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    },
    
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        return !!(token && user);
    },
    
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return localStorage.getItem('authToken');
    },

    async refreshToken() {
        try {
            const response = await apiClient.post('/auth/refresh');
            if (response.data.success) {
                const { token } = response.data.data;
                localStorage.setItem('authToken', token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
        return false;
    },

    async getCurrentUserFromServer() {
        try {
            const response = await apiClient.get('/auth/me');
            if (response.data.success) {
                const user = response.data.data;
                localStorage.setItem('user', JSON.stringify(user));
                return user;
            }
        } catch (error) {
            console.error('Failed to get current user:', error);
            this.logout();
        }
        return null;
    }
};

// Add the validateUser function that Login component expects
export const validateUser = async (username, password) => {
    const result = await authService.login(username, password);
    return result.success;
};

export default authService;