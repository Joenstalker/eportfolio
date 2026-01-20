import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LogoutButton.css';

const LogoutButton = ({ variant = 'default', size = 'medium' }) => {
    const [loading, setLoading] = useState(false);
    const { logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            setLoading(true);
            try {
                await logoutUser();
                navigate('/login?logout=true');
            } catch (error) {
                console.error('Logout error:', error);
                // Fallback: clear localStorage and redirect
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login';
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <button
            className={`logout-button ${variant} ${size}`}
            onClick={handleLogout}
            disabled={loading}
            title="Logout"
        >
            {loading ? (
                <>
                    <span className="spinner"></span>
                    <span className="btn-text">Logging out...</span>
                </>
            ) : (
                <>
                    <svg 
                        className="logout-icon" 
                        viewBox="0 0 24 24" 
                        width="16" 
                        height="16"
                        fill="currentColor"
                    >
                        <path d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z" />
                    </svg>
                    <span className="btn-text">Logout</span>
                </>
            )}
        </button>
    );
};

export default LogoutButton;