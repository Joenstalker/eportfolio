import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import './Layout.css';

const Layout = () => {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    // Check if profile is complete
    const isProfileComplete = (userData) => {
        if (!userData) return false;
        return userData.firstName && 
               userData.lastName && 
               userData.email && 
               userData.department && 
               userData.position &&
               (userData.firstName.trim() !== '' && 
                userData.lastName.trim() !== '' && 
                userData.email.trim() !== '' && 
                userData.department.trim() !== '' && 
                userData.position.trim() !== '');
    };

    useEffect(() => {
        if (user && !isProfileComplete(user)) {
            // Show a persistent reminder about incomplete profile
            Swal.fire({
                title: 'Profile Incomplete!',
                html: 'Your profile is incomplete. Please complete your profile information in the Profile Dashboard to access all features.<br/><br/><b>Required fields:</b> Name, Email, Department, Position',
                icon: 'warning',
                confirmButtonColor: '#3498db',
                confirmButtonText: 'Go to Profile',
                showCancelButton: true,
                cancelButtonText: 'Later',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/dashboard');
                }
            });
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <div className="layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <h3>Faculty Portfolio</h3>
                    <p>Welcome, {user?.personalInfo?.firstName || 'User'}</p>
                </div>
                
                <ul className="sidebar-menu">
                    <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Profile Dashboard</NavLink></li>
                    <li><NavLink to="/teaching-portfolio" className={({ isActive }) => isActive ? 'active' : ''}>Teaching Portfolio</NavLink></li>
                    <li><NavLink to="/class-portfolio" className={({ isActive }) => isActive ? 'active' : ''}>Class Portfolio</NavLink></li>
                    <li><NavLink to="/research" className={({ isActive }) => isActive ? 'active' : ''}>Research</NavLink></li>
                    <li><NavLink to="/syllabus" className={({ isActive }) => isActive ? 'active' : ''}>Syllabus</NavLink></li>
                    <li><NavLink to="/instructional-materials" className={({ isActive }) => isActive ? 'active' : ''}>Instructional Materials</NavLink></li>
                    <li><NavLink to="/seminars-certificates" className={({ isActive }) => isActive ? 'active' : ''}>Seminars & Certificates</NavLink></li>
                </ul>
                
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </nav>
            
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;