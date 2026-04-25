import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    return (
        <div className="layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <h3>Faculty Portfolio</h3>
                    <p>Welcome, {user?.firstName || (user?.personalInfo?.fullName ? user.personalInfo.fullName.split(' ')[0] : (user?.name ? user.name.split(' ')[0] : 'User'))}</p>
                </div>
                
                <ul className="sidebar-menu">
                    <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
                    <li><NavLink to="/portfolio" className={({ isActive }) => isActive ? 'active' : ''}>Portfolio</NavLink></li>
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