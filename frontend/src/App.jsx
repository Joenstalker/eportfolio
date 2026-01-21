import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Dashboard from './components/faculty/Dashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import GoogleAuthCallback from './components/googleAuthCallback';
import GoogleChoose from './components/googleChoose';
import Layout from './components/Layout/Layout';
import TeachingPortfolio from './components/faculty/TeachingPortfolio';
import ClassPortfolio from './components/faculty/ClassPortfolio';
import SeminarsCertificates from './components/faculty/SeminarsCertificates';
import Research from './components/faculty/Research';
import Syllabus from './components/faculty/Syllabus';
import InstructionalMaterials from './components/faculty/InstructionalMaterials';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  // Prefer role from JWT (source of truth), fallback to user.role
  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof json.role === 'string' ? json.role.toLowerCase() : null;
    } catch {
      return null;
    }
  };

  const role = getRoleFromToken() || (typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role);
  if (user && role === 'admin') {
    return children;
  }
  
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

function App() {
  const adminPaths = [
    '/admin-dashboard',
    '/admin-faculty-management',
    '/admin-archived-users',
    '/admin-course-management',
    '/admin-class-assignments',
    '/admin-reports',
    '/admin-system-analytics',
    '/admin-system-settings'
  ];

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/auth/choose" element={<GoogleChoose />} />
            
            {/* Protected Routes with Layout */}
            <Route 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teaching-portfolio" element={<TeachingPortfolio />} />
              <Route path="/class-portfolio" element={<ClassPortfolio />} />
              <Route path="/research" element={<Research />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/instructional-materials" element={<InstructionalMaterials />} />
              <Route path="/seminars-certificates" element={<SeminarsCertificates />} />
            </Route>
            
            {/* Admin Routes with tab-specific URLs */}
            {adminPaths.map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            ))}
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;