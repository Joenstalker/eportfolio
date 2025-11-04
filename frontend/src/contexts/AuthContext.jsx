import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, verifyToken } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token with backend
                    const userData = await verifyToken(storedToken);
                    setUser(userData.user);
                    setToken(storedToken);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const setAuthFromToken = async (jwtToken) => {
        try {
            const data = await verifyToken(jwtToken);
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setToken(jwtToken);
            return data.user;
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw error;
        }
    };

    const loginUser = async (email, password) => {
        try {
            console.log('🔐 Attempting login for:', email);
            
            const response = await login(email, password);

            console.log('✅ Login response:', response);

            if (response.token && response.user) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                setUser(response.user);
                setToken(response.token);
                
                return response;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('❌ Login failed:', error);
            
            // More specific error messages
            if (error.response?.status === 400) {
                throw new Error('Invalid email or password');
            } else if (error.response?.status === 404) {
                throw new Error('User not found');
            } else if (error.response?.status === 500) {
                throw new Error('Server error. Please try again later.');
            } else {
                throw new Error(error.response?.data?.message || 'Login failed');
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        login: loginUser,
        setAuthFromToken,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;