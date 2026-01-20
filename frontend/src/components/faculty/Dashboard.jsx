import React, { useState, useContext, useRef } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import ProfileDashboard from './ProfileDashboard';
import TeachingPortfolio from './TeachingPortfolio';
import ClassPortfolio from './ClassPortfolio';
import SeminarsCertificates from './SeminarsCertificates';
import Research from './Research';
import Syllabus from './Syllabus';
import InstructionalMaterials from './InstructionalMaterials';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [profilePic, setProfilePic] = useState(localStorage.getItem('facultyProfilePic') || 'https://via.placeholder.com/150');
    const [showDropdown, setShowDropdown] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoClick = () => {
        setShowDropdown(!showDropdown);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
        setShowDropdown(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
                localStorage.setItem('facultyProfilePic', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const tabs = [
        { id: 'profile', label: 'PROFILE DASHBOARD', icon: '👤' },
        { id: 'teaching', label: 'TEACHING PORTFOLIO', icon: '📚' },
        { id: 'class', label: 'CLASS PORTFOLIO', icon: '👥' },
        { id: 'seminars', label: 'SEMINARS AND CERTIFICATES', icon: '🎓' },
        { id: 'research', label: 'RESEARCH', icon: '🔬' },
        { id: 'syllabus', label: 'SYLLABUS', icon: '📝' },
        { id: 'materials', label: 'INSTRUCTIONAL MATERIALS', icon: '📋' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileDashboard />;
            case 'teaching':
                return <TeachingPortfolio />;
            case 'class':
                return <ClassPortfolio />;
            case 'seminars':
                return <SeminarsCertificates />;
            case 'research':
                return <Research />;
            case 'syllabus':
                return <Syllabus />;
            case 'materials':
                return <InstructionalMaterials />;
            default:
                return <ProfileDashboard />;
        }
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>🎓 Faculty E-Portfolio</h1>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span className="welcome-text">Welcome, {user?.firstName || user?.name || 'User'}</span>
                        <div className="profile-wrapper">
                            <div className="profile-pic-container" onClick={handlePhotoClick}>
                                <img src={profilePic} alt="Profile" className="profile-pic" />
                            </div>
                            {showDropdown && (
                                <div className="profile-dropdown">
                                    <button onClick={triggerFileInput} className="dropdown-item">Change Photo</button>
                                    <button onClick={logout} className="dropdown-item logout">Logout</button>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }} 
                                accept="image/*"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="tab-navigation">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="dashboard-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;