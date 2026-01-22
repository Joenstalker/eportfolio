import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const ProfileDashboard = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        department: '',
        position: '',
        phone: '',
        office: '',
        bio: ''
    });
    const [stats, setStats] = useState({
        teachingFiles: 0,
        classFiles: 0,
        researchPapers: 0,
        seminars: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                department: user.department || '',
                position: user.position || '',
                phone: user.phone || '',
                office: user.office || '',
                bio: user.bio || ''
            });
            loadStats();
        }
    }, [user]);

    // In ProfileDashboard.jsx - fix the loadStats function
const loadStats = async () => {
    try {
        const token = ensureToken();
        if (!token) {
            console.error('No token available');
            return;
        }
        
        // Load teaching portfolio stats
        const teachingResponse = await fetch('http://localhost:5000/api/teaching', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!teachingResponse.ok) {
            throw new Error(`HTTP error! status: ${teachingResponse.status}`);
        }
        const teachingData = await teachingResponse.json();
        
        // Load class portfolio stats - FIXED flatMap issue
        const classResponse = await fetch('http://localhost:5000/api/class-portfolio', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!classResponse.ok) {
            throw new Error(`HTTP error! status: ${classResponse.status}`);
        }
        const classData = await classResponse.json();
        
        // Load research stats
        const researchResponse = await fetch('http://localhost:5000/api/research', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!researchResponse.ok) {
            throw new Error(`HTTP error! status: ${researchResponse.status}`);
        }
        const researchData = await researchResponse.json();
        
        // Load seminars stats
        const seminarsResponse = await fetch('http://localhost:5000/api/seminars', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!seminarsResponse.ok) {
            throw new Error(`HTTP error! status: ${seminarsResponse.status}`);
        }
        const seminarsData = await seminarsResponse.json();

        // Fix flatMap issue - handle both array and object responses
        let classFilesCount = 0;
        if (Array.isArray(classData)) {
            classFilesCount = classData.flatMap(portfolio => portfolio.materials || []).length;
        } else if (classData && classData.materials) {
            classFilesCount = classData.materials.length;
        }

        setStats({
            teachingFiles: teachingData.subjects?.length || 0,
            classFiles: classFilesCount,
            researchPapers: researchData.researchPapers?.length || 0,
            seminars: seminarsData.seminars?.length || 0
        });
    } catch (error) {
        console.error('Error loading stats:', error);
        if (error.message.includes('Failed to fetch')) {
            Swal.fire({
                title: 'Connection Error!',
                text: 'Unable to connect to server. Please make sure the backend is running.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: `Error loading stats: ${error.message}`,
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        }
    }
};

    const handleSave = async () => {
        if (!user?._id) return;

        setLoading(true);
        try {
            const token = ensureToken();
            if (!token) {
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            // Split the name into firstName and lastName
            const nameParts = profile.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Prepare personal info for the profile dashboard
            const personalInfo = {
                fullName: profile.name,
                email: profile.email,
                phone: profile.phone,
                department: profile.department,
                position: profile.position,
                office: profile.office
            };
            
            // Update both the profile dashboard and the user info
            const [profileResponse, userResponse] = await Promise.all([
                fetch('http://localhost:5000/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ personalInfo })
                }),
                fetch('http://localhost:5000/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName: firstName,
                        lastName: lastName,
                        email: profile.email,
                        department: profile.department,
                        phone: profile.phone,
                        office: profile.office,
                        bio: profile.bio
                    })
                })
            ]);
            
            if (!profileResponse.ok || !userResponse.ok) {
                const profileError = profileResponse.status !== 200 ? `Profile update failed (${profileResponse.status})` : null;
                const userError = userResponse.status !== 200 ? `User profile update failed (${userResponse.status})` : null;
                
                throw new Error([profileError, userError].filter(Boolean).join(' and '));
            }
            
            const profileResult = await profileResponse.json();
            const userResult = await userResponse.json();
            
            Swal.fire({
                title: 'Success!',
                text: 'Profile updated successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 3000,
                timerProgressBar: true
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error updating profile: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Faculty Profile</h2>
                <p>Manage your personal and professional information</p>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <h3>Personal Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({...profile, name: e.target.value})}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input
                                type="text"
                                value={profile.department}
                                onChange={(e) => setProfile({...profile, department: e.target.value})}
                                placeholder="Enter your department"
                            />
                        </div>
                        <div className="form-group">
                            <label>Position</label>
                            <input
                                type="text"
                                value={profile.position}
                                onChange={(e) => setProfile({...profile, position: e.target.value})}
                                placeholder="Enter your position"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                placeholder="Enter your phone number"
                            />
                        </div>
                        <div className="form-group">
                            <label>Office</label>
                            <input
                                type="text"
                                value={profile.office}
                                onChange={(e) => setProfile({...profile, office: e.target.value})}
                                placeholder="Enter your office location"
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Bio/Introduction</label>
                        <textarea
                            rows="4"
                            value={profile.bio}
                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                            placeholder="Write a brief introduction about yourself..."
                        />
                    </div>

                    <button 
                        className="save-button" 
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                <div className="stats-sidebar">
                    <div className="stat-card">
                        <h4>Quick Stats</h4>
                        <div className="stat-item">
                            <span className="stat-label">Teaching Portfolio</span>
                            <span className="stat-value">{stats.teachingFiles} Subjects</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Class Portfolio</span>
                            <span className="stat-value">{stats.classFiles} Files</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Research Papers</span>
                            <span className="stat-value">{stats.researchPapers}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Seminars</span>
                            <span className="stat-value">{stats.seminars}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDashboard;