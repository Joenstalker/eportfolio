// contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    // Start as loading=true so routes don't redirect before we restore from localStorage
    const [loading, setLoading] = useState(true);

    // DEV: ensure demo users exist (safe to ignore errors)
    useEffect(() => {
        const setupDemo = async () => {
            try {
                await fetch('http://localhost:5000/api/auth/setup-demo', { method: 'POST' });
            } catch (e) {
                // ignore
            }
        };
        setupDemo();
    }, []);

    // Proper login function implementation
    const loginUser = async (email, password) => {
        setLoading(true);
        try {
            console.log('🔐 Attempting login for:', email);
            
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('📡 Login response status:', response.status);

            const data = await response.json();
            console.log('📦 Full response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            console.log('✅ Login successful');
            console.log('👤 User role from backend:', data.user?.role);
            console.log('🔑 Token received:', data.token ? 'Yes' : 'No');

            // Store user data and token
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                setToken(data.token);
            }

            return data;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    // Check if user is logged in on app start
    useEffect(() => {
        const restoreSession = () => {
            try {
                const storedUser = localStorage.getItem('user');
                const storedToken = localStorage.getItem('token');
                
                if (storedUser && storedToken) {
                    const userData = JSON.parse(storedUser);
                    console.log('🔄 Restored user from localStorage:', userData);
                    console.log('🔄 User role from localStorage:', userData.role);
                    setUser(userData);
                    setToken(storedToken);
                }
            } catch (e) {
                console.error('Error restoring auth session:', e);
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        loginUser,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Export the context
export { AuthContext };

// Custom hook for easier usage
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export default AuthContext;