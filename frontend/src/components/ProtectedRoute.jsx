// Create a ProtectedRoute component
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
        // If specific role is required and user doesn't have it
        if (user.role === 'admin') {
            return <Navigate to="/admin-dashboard" />;
        } else {
            return <Navigate to="/dashboard" />;
        }
    }
    
    return children;
};

export default ProtectedRoute;