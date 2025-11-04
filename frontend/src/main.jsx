import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Check if Google Client ID is provided
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn('Google OAuth Client ID not found. Google Login will use demo mode.');
}

// Only wrap with GoogleOAuthProvider if client ID exists
const AppWrapper = googleClientId ? (
  <React.StrictMode>
    <App />
  </React.StrictMode>
) : (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(AppWrapper);