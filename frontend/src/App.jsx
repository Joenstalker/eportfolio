import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login/Login';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import FacultyPortfolio from './components/faculty/FacultyPortfolio';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import GoogleAuthCallback from './components/googleAuthCallback';
import GoogleChoose from './components/googleChoose';
import Layout from './components/Layout/Layout';
import TeachingPortfolio from './components/faculty/TeachingPortfolio';
import FacultyClassLists from './components/faculty/FacultyClassLists';
import ClassPortfolio from './components/faculty/ClassPortfolio';
import SeminarsCertificates from './components/faculty/SeminarsCertificates';
import Research from './components/faculty/Research';
// Use the new modern syllabus dashboard
import Syllabus from './components/faculty/SyllabusDashboard';
import InstructionalMaterials from './components/faculty/InstructionalMaterials';
import './App.css';

function App() {
  const adminPaths = [
    '/admin-dashboard',
    '/admin-research-tracking',
    '/admin-course-assignments',
    '/admin-reports',
    '/admin-system-analytics',
    '/admin-evidence-review',
    '/admin-user-logs',
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
                <ProtectedRoute requiredRole="faculty">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<FacultyDashboard />} />
              <Route path="/portfolio" element={<FacultyPortfolio />} />
            </Route>

            {/* Admin Routes with tab-specific URLs */}
            {adminPaths.map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
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
