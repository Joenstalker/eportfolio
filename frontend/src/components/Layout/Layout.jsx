import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
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
                    <li><Link to="/dashboard">Profile Dashboard</Link></li>
                    <li><Link to="/teaching-portfolio">Teaching Portfolio</Link></li>
                    <li><Link to="/class-portfolio">Class Portfolio</Link></li>
                    <li><Link to="/research">Research</Link></li>
                    <li><Link to="/syllabus">Syllabus</Link></li>
                    <li><Link to="/instructional-materials">Instructional Materials</Link></li>
                    <li><Link to="/seminars-certificates">Seminars & Certificates</Link></li>
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