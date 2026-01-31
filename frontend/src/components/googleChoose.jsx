// src/components/GoogleChoose.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleChoose = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthFromToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract user data from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const email = urlParams.get('email');
  const name = urlParams.get('name');
  const googleId = urlParams.get('googleId');

  useEffect(() => {
    // If any required parameters are missing, redirect to login
    if (!email || !name || !googleId) {
      console.error('Missing required parameters for Google signup');
      navigate('/login', { state: { error: 'Invalid Google signup request' } });
    }
  }, [email, name, googleId, navigate]);

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`User selected ${selectedRole} role`);
      
      // Call backend to complete Google sign-in
      const response = await fetch('http://localhost:5000/api/auth/google/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId,
          email,
          name,
          role: selectedRole
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete Google sign-in');
      }

      // Set authentication with the received token
      await setAuthFromToken(data.token);
      
      // Navigate based on selected role
      if (selectedRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError(err.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  const handleFacultySelection = () => {
    handleRoleSelection('faculty');
  };

  const handleAdminSelection = () => {
    handleRoleSelection('admin');
  };

  if (!email || !name || !googleId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <p>Invalid request. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px'
    }}>
      <h2>Welcome, {name}!</h2>
      <p>You've signed in with Google as <strong>{email}</strong></p>
      <p>Please choose your role to continue:</p>
      
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          border: '1px solid red', 
          borderRadius: '5px',
          marginBottom: '10px' 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={handleFacultySelection}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : 'Continue as Faculty'}
        </button>
        <button 
          onClick={handleAdminSelection}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : 'Continue as Admin'}
        </button>
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div style={{ 
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '10px' }}>Creating your account...</p>
        </div>
      )}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GoogleChoose;