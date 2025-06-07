import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateUser } from '../services/authService';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', username); // Debug log
            const isValidUser = validateUser(username, password);
            console.log('isValidUser:', isValidUser); // Debug log
            if (isValidUser) {
                console.log('Login successful, navigating to search'); // Debug log
                navigate('/search');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Google Sheets Search</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Enter your username"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                <p>Test credentials:</p>
                <p>Username: jagdishchand, Password: jagdish123</p>
                <p>Username: vinodsharma, Password: vinod123</p>
            </div>
        </div>
    );
};

export default Login;