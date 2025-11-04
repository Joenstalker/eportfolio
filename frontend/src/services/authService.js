import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Login function
export const login = async (email, password) => {
    try {
        console.log('🔄 Sending login request to:', `${API_URL}/auth/login`);
        console.log('📧 Email:', email);
        
        const response = await api.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password: password
        });

        console.log('✅ Login successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Login error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        throw error;
    }
};

// Verify token
export const verifyToken = async (token) => {
    try {
        const response = await api.get('/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Token verification error:', error);
        throw error;
    }
};

// Register function (if needed)
export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Forgot password
export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
};

// Reset password
export const resetPassword = async (email, code, newPassword) => {
    try {
        const response = await api.post('/auth/reset-password', {
            email,
            code,
            newPassword
        });
        return response.data;
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
};

export default api;