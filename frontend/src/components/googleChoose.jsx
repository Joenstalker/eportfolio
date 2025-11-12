import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login/Login.css';

const GoogleChoose = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const name = params.get('name') || '';
  const googleId = params.get('googleId') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chooseRole = async (role) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId, email, name, role })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to complete sign-in');

      // Redirect to frontend callback route with token so existing logic handles it
      navigate(`/auth/callback?token=${data.token}`);
    } catch (err) {
      console.error('Error completing google sign-in:', err);
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Complete sign in</h2>
        <p>We found no account for <strong>{email}</strong>.</p>
        <p>Choose how you want to sign in to this system:</p>

        {error && <div className="error-message">{error}</div>}

        <div style={{display: 'flex', gap: '8px', marginTop: '1rem'}}>
          <button className="save-button" onClick={() => chooseRole('faculty')} disabled={loading}>
            Continue as Faculty
          </button>
          <button className="save-button" onClick={() => chooseRole('admin')} disabled={loading}>
            Continue as Admin
          </button>
        </div>

        <p style={{marginTop: '1rem', fontSize: '0.9rem'}}>If you don't want to create an account, please contact your administrator.</p>
      </div>
    </div>
  );
};

export default GoogleChoose;
