import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateUser } from '../services/authService';
import authService from '../services/authService';

let loginRenderCount = 0;

const Login = memo(() => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hasCheckedAuth = useRef(false);

    // Increment render counter
    loginRenderCount++;
    console.log(`🔄 Login component render #${loginRenderCount}`);

    // Check if user is already logged in - prevent infinite calls
    useEffect(() => {
        console.log("📋 Login useEffect - hasCheckedAuth.current:", hasCheckedAuth.current);
        if (hasCheckedAuth.current) {
            console.log("⛔ Login useEffect - Already checked auth, returning early");
            return;
        }
        hasCheckedAuth.current = true;

        console.log("✅ Login useEffect - First auth check, proceeding...");
        console.log('🔍 Login: Checking auth status...');
        if (authService.isAuthenticated()) {
            console.log('🚀 Login: User already authenticated, redirecting to search');
            navigate('/search', { replace: true });
        } else {
            console.log('❌ Login: User not authenticated, staying on login page');
        }
    }, []); // Empty dependency array

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('🔐 Attempting login with:', username);
            
            const result = await validateUser(username, password);
            console.log('✔️ Login result:', result);
            
            if (result) {
                console.log('🎉 Login successful, navigating to search page');
                navigate('/search', { replace: true });
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            console.error('💥 Login error:', err);
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Vinod Electronics Search</h2>
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
                <p>Available user roles:</p>
                <p><strong>Admin:</strong> jagdishsharma / jagdish123</p>
                <p><strong>Manager:</strong> vinodsharma / vinod123</p>
                <p><strong>Employee:</strong> emp / emp123</p>
            </div>
        </div>
    );
});

Login.displayName = 'Login';

export default Login;