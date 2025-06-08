const VALID_USERS = [
    { username: 'jagdishsharma', password: 'jagdish123' },
    { username: 'vinodsharma', password: 'vinod123' },
    { username: 'emp', password: 'emp123' }
];

const authService = {
    login: (username, password) => {
        const user = VALID_USERS.find(user => user.username === username && user.password === password);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            console.log('🎉 Auth state saved, dispatching event');
            
            // Dispatch custom event to notify App component
            window.dispatchEvent(new CustomEvent('authStateChanged'));
            
            return true;
        }
        return false;
    },
    
    logout: () => {
        localStorage.removeItem('user');
        console.log('🚪 Logout completed, dispatching event');
        
        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    },
    
    isAuthenticated: () => {
        return localStorage.getItem('user') !== null;
    },
    
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// Add the validateUser function that Login component expects
export const validateUser = (username, password) => {
    return authService.login(username, password);
};

export default authService;