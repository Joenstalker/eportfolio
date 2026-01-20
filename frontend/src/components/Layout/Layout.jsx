import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
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