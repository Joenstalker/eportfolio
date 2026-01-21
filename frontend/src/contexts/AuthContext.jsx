// contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    // Start as loading=true so routes don't redirect before we restore from localStorage
    const [loading, setLoading] = useState(true);

    // NOTE: demo user auto-seeding removed. Users should be created via DB seeding script
    // or via authenticated admin user-management endpoints.

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

            const getRoleFromToken = (jwtToken) => {
                try {
                    if (!jwtToken || typeof jwtToken !== 'string') return null;
                    const [, payload] = jwtToken.split('.');
                    if (!payload) return null;
                    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
                    return typeof json.role === 'string' ? json.role.toLowerCase() : null;
                } catch {
                    return null;
                }
            };

            // Store user data and token (normalize role, prefer role from JWT if available)
            if (data.token && data.user) {
                const roleFromJwt = getRoleFromToken(data.token);
                const normalizedUser = {
                    ...data.user,
                    role: roleFromJwt || (typeof data.user.role === 'string' ? data.user.role.toLowerCase() : data.user.role),
                };
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(normalizedUser));
                setUser(normalizedUser);
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
                    const getRoleFromToken = (jwtToken) => {
                        try {
                            if (!jwtToken || typeof jwtToken !== 'string') return null;
                            const [, payload] = jwtToken.split('.');
                            if (!payload) return null;
                            const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
                            return typeof json.role === 'string' ? json.role.toLowerCase() : null;
                        } catch {
                            return null;
                        }
                    };
                    const roleFromJwt = getRoleFromToken(storedToken);
                    const normalizedUser = {
                        ...userData,
                        role: roleFromJwt || (typeof userData.role === 'string' ? userData.role.toLowerCase() : userData.role),
                    };
                    console.log('🔄 Restored user from localStorage:', userData);
                    console.log('🔄 User role from localStorage:', userData.role);
                    setUser(normalizedUser);
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
        // Backwards-compatible alias: some components call `logout`
        logout: logoutUser,
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