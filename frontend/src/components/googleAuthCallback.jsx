import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleAuthCallback = () => {
    const navigate = useNavigate();
    const { setAuthFromToken } = useAuth();

    useEffect(() => {
        const handleGoogleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (token) {
                try {
                    await setAuthFromToken(token);
                    navigate('/dashboard');
                } catch (error) {
                    console.error('Google auth error:', error);
                    navigate('/login', { state: { error: 'Google authentication failed' } });
                }
            } else {
                // Handle error
                navigate('/login', { state: { error: 'Google authentication failed - no token received' } });
            }
        };

        handleGoogleCallback();
    }, [navigate]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing Google authentication...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we sign you in.</p>
            </div>
        </div>
    );
};

export default GoogleAuthCallback;