import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Dashboard from './components/faculty/Dashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import GoogleAuthCallback from './components/googleAuthCallback';
// FIXED: Use correct relative path
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
  
  if (user && user.role === 'admin') {
    return children;
  }
  
  return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/auth/choose" element={<GoogleChoose />} />
            
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
            
            <Route 
              path="/admin-dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;