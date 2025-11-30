// src/components/GoogleChoose.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleChoose = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFacultySelection = () => {
    // Handle faculty role selection logic here
    console.log('User selected faculty role');
    navigate('/dashboard');
  };

  const handleAdminSelection = () => {
    // Handle admin role selection logic here
    console.log('User selected admin role');
    navigate('/admin-dashboard');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Choose Your Role</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={handleFacultySelection}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Continue as Faculty
        </button>
        <button 
          onClick={handleAdminSelection}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Continue as Admin
        </button>
      </div>
    </div>
  );
};

export default GoogleChoose;