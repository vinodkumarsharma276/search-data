import { DUMMY_USERS } from '../utils/constants';

const authService = {
    login: (username, password) => {
        const user = DUMMY_USERS.find(user => user.username === username && user.password === password);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            return true;
        }
        return false;
    },
    logout: () => {
        localStorage.removeItem('user');
    },
    isAuthenticated: () => {
        return localStorage.getItem('user') !== null;
    },
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};

// Add the validateUser function that Login component expects
export const validateUser = (username, password) => {
    return authService.login(username, password);
};

export default authService;