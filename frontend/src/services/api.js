import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Manual login with email and password
  manualLogin: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Verify JWT token
  verifyToken: async (token) => {
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Setup demo users (optional)
  setupDemo: async () => {
    try {
      const response = await apiClient.post('/auth/setup-demo');
      return response.data;
    } catch (error) {
      console.log('Demo setup not available, continuing...');
      return { success: true };
    }
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};

// Teaching Portfolio API
export const teachingPortfolioAPI = {
  // Get all teaching portfolios
  getAll: async () => {
    const response = await apiClient.get('/teaching-portfolio');
    return response.data;
  },

  // Get teaching portfolio by ID
  getById: async (id) => {
    const response = await apiClient.get(`/teaching-portfolio/${id}`);
    return response.data;
  },

  // Create new teaching portfolio
  create: async (portfolioData) => {
    const response = await apiClient.post('/teaching-portfolio', portfolioData);
    return response.data;
  },

  // Update teaching portfolio
  update: async (id, portfolioData) => {
    const response = await apiClient.put(`/teaching-portfolio/${id}`, portfolioData);
    return response.data;
  },

  // Delete teaching portfolio
  delete: async (id) => {
    const response = await apiClient.delete(`/teaching-portfolio/${id}`);
    return response.data;
  },

  // Get teaching portfolio by faculty
  getByFaculty: async (facultyId) => {
    const response = await apiClient.get(`/teaching-portfolio/faculty/${facultyId}`);
    return response.data;
  },

  // Test connection
  testConnection: async () => {
    try {
      const response = await apiClient.get('/teaching-portfolio/test');
      return response.data;
    } catch (error) {
      throw new Error('Teaching Portfolio API connection failed');
    }
  }
};

// Class Portfolio API
export const classPortfolioAPI = {
  // Get all class portfolios
  getAll: async () => {
    const response = await apiClient.get('/class-portfolio');
    return response.data;
  },

  // Get class portfolio by ID
  getById: async (id) => {
    const response = await apiClient.get(`/class-portfolio/${id}`);
    return response.data;
  },

  // Create new class portfolio
  create: async (portfolioData) => {
    const response = await apiClient.post('/class-portfolio', portfolioData);
    return response.data;
  },

  // Update class portfolio
  update: async (id, portfolioData) => {
    const response = await apiClient.put(`/class-portfolio/${id}`, portfolioData);
    return response.data;
  },

  // Delete class portfolio
  delete: async (id) => {
    const response = await apiClient.delete(`/class-portfolio/${id}`);
    return response.data;
  },

  // Get class portfolio by faculty
  getByFaculty: async (facultyId) => {
    const response = await apiClient.get(`/class-portfolio/faculty/${facultyId}`);
    return response.data;
  },

  // Test connection
  testConnection: async () => {
    try {
      const response = await apiClient.get('/class-portfolio/test');
      return response.data;
    } catch (error) {
      throw new Error('Class Portfolio API connection failed');
    }
  }
};

// User Management API
export const userAPI = {
  // Get all users
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

// Default export
export default {
  authAPI,
  teachingPortfolioAPI,
  classPortfolioAPI,
  userAPI,
  healthAPI
};