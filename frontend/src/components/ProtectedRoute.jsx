// Create a ProtectedRoute component
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const ProtectedRoute = ({ children, requiredRole, requiredPermissions = [] }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    // Check role requirement
    if (requiredRole) {
        const userRole = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
        const requiredRoleLower = typeof requiredRole === 'string' ? requiredRole.toLowerCase() : requiredRole;
        
        if (userRole !== requiredRoleLower) {
            // Show unauthorized access alert
            Swal.fire({
                title: 'Access Denied!',
                text: `You don't have permission to access this page. Required role: ${requiredRole}.`,
                icon: 'error',
                confirmButtonColor: '#e74c3c',
                confirmButtonText: 'Go to Dashboard'
            }).then(() => {
                if (userRole === 'admin') {
                    window.location.href = '/admin-dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            });
            
            if (userRole === 'admin') {
                return <Navigate to="/admin-dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }
    
    // Check permissions if required
    if (requiredPermissions.length > 0) {
        const userRole = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
        
        // Define role-based permissions
        const rolePermissions = {
            'admin': ['read', 'write', 'update', 'delete', 'manage_users', 'manage_courses', 'view_reports'],
            'hod': ['read', 'write', 'update', 'view_department'],
            'faculty': ['read', 'write', 'update']
        };
        
        const userPermissions = rolePermissions[userRole] || [];
        
        const hasRequiredPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission)
        );
        
        if (!hasRequiredPermissions) {
            Swal.fire({
                title: 'Insufficient Permissions!',
                text: `You don't have the required permissions to access this page.`,
                icon: 'warning',
                confirmButtonColor: '#3498db',
                confirmButtonText: 'Go to Dashboard'
            });
            
            return userRole === 'admin' ? 
                <Navigate to="/admin-dashboard" replace /> : 
                <Navigate to="/dashboard" replace />;
        }
    }
    
    return children;
};

export default ProtectedRoute;