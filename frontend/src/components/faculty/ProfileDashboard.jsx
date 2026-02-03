import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import './facultyComponents.css';

const ProfileDashboard = () => {
    const { user, ensureToken, setUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        department: '',
        position: '',
        phone: '',
        office: '',
        bio: ''
    });

    // Check if profile is complete
    const isProfileComplete = () => {
        return profile.name.trim() !== '' && 
               profile.email.trim() !== '' && 
               profile.department.trim() !== '' && 
               profile.position.trim() !== '';
    };
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
        
        // Load all stats in parallel with individual error handling
        const [teachingResponse, classResponse, researchResponse, seminarsResponse] = await Promise.all([
            fetch('http://localhost:5000/api/teaching', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null),
            fetch('http://localhost:5000/api/class-portfolio', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null),
            fetch('http://localhost:5000/api/research', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null),
            fetch('http://localhost:5000/api/seminars', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null)
        ]);

        // Process responses with fallback handling
        const teachingData = teachingResponse?.ok ? await teachingResponse.json() : { subjects: [] };
        const classData = classResponse?.ok ? await classResponse.json() : [];
        const researchData = researchResponse?.ok ? await researchResponse.json() : [];
        const seminarsData = seminarsResponse?.ok ? await seminarsResponse.json() : [];

        // Calculate stats with proper fallbacks
        let classFilesCount = 0;
        if (Array.isArray(classData)) {
            classFilesCount = classData.reduce((total, portfolio) => 
                total + (portfolio.materials?.length || 0), 0
            );
        } else if (classData && classData.materials) {
            classFilesCount = classData.materials.length;
        }

        setStats({
            teachingFiles: teachingData.subjects?.length || 0,
            classFiles: classFilesCount,
            researchPapers: researchData.length || 0,
            seminars: seminarsData.length || 0
        });
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default stats on error
        setStats({
            teachingFiles: 0,
            classFiles: 0,
            researchPapers: 0,
            seminars: 0
        });
        
        if (error.message.includes('Failed to fetch')) {
            Swal.fire({
                title: 'Connection Error!',
                text: 'Unable to connect to server. Please make sure the backend is running.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        }
    }
};

    const handleSave = async () => {
        console.log('🚀 Save button clicked, starting save process...');
        console.log('Current user data:', user);
        
        // Validate user exists and has basic required fields
        if (!user) {
            console.error('❌ No user data found');
            Swal.fire({
                title: 'Error!',
                text: 'User data not found. Please log in again.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }
        
        // Basic validation - just ensure we have the essential user data
        // The APIs use the authenticated user from the token, so we don't need strict ID validation
        if (!user.email) {
            console.error('❌ User email missing:', user);
            Swal.fire({
                title: 'Error!',
                text: 'User email not found. Please log in again.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }
        
        console.log('✅ User validated. Email:', user.email);

        setLoading(true);
        console.log('⏳ Setting loading state to true');
        
        try {
            const token = ensureToken();
            console.log('🔑 Token retrieved:', token ? 'Present' : 'Missing');
            
            if (!token) {
                console.error('❌ No authentication token found');
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                setLoading(false);
                return;
            }
            
            // Split the name into firstName and lastName
            let firstName = '';
            let lastName = '';
            
            if (profile.name && profile.name.trim() !== '') {
                const nameParts = profile.name.trim().split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            }
            
            // Prepare personal info for the profile dashboard
            const personalInfo = {
                fullName: profile.name,
                email: profile.email,
                phone: profile.phone,
                department: profile.department,
                position: profile.position,
                office: profile.office
            };
            
            console.log('Sending profile update request with data:', { personalInfo, firstName, lastName, email: profile.email, department: profile.department, position: profile.position, phone: profile.phone, office: profile.office, bio: profile.bio });
            
            console.log('🌐 Making API calls to save profile...');
            
            // Update user profile through the auth endpoint (primary source of truth)
            console.log('📤 Sending request to /api/auth/profile');
            
            const userResponse = await fetch('http://localhost:5000/api/auth/profile', {
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
                    position: profile.position,
                    phone: profile.phone,
                    office: profile.office,
                    bio: profile.bio
                })
            });
            
            console.log('📥 Received response from auth API');
            console.log('User response status:', userResponse.status);
            
            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                throw new Error(`User profile update failed (${userResponse.status}): ${errorText}`);
            }
            
            // Parse the response
            const userResult = await userResponse.json();
            console.log('User API response:', userResult);
            
            // Update the user context with the new data
            let updatedUserData = null;
            
            if (userResult && userResult.user) {
                console.log('Updating user context with user API response:', userResult.user);
                updatedUserData = userResult.user;
            }
            
            if (updatedUserData) {
                // Update the user context with the newly updated user data
                // This will help ensure that the Layout component recognizes the profile as complete
                setUser(updatedUserData);
                
                // Also update the local profile state to match
                setProfile({
                    name: `${updatedUserData.firstName || ''} ${updatedUserData.lastName || ''}`.trim(),
                    email: updatedUserData.email || '',
                    department: updatedUserData.department || '',
                    position: updatedUserData.position || '',
                    phone: updatedUserData.phone || '',
                    office: updatedUserData.office || '',
                    bio: updatedUserData.bio || ''
                });
                
                // Update localStorage as well to ensure data persists across page refreshes
                localStorage.setItem('user', JSON.stringify(updatedUserData));
            } else {
                console.warn('Could not update user context - no valid user data received from APIs');
            }
            
            console.log('✅ Profile save completed successfully!');
            console.log('Final profile state after update:', profile);
            
            Swal.fire({
                title: '✅ Profile Saved Successfully!',
                html: `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 15px;">🎉</div>
                        <div style="font-size: 18px; margin-bottom: 10px; color: #27ae60;">
                            <strong>Your profile information has been saved!</strong>
                        </div>
                        <div style="font-size: 14px; color: #7f8c8d;">
                            All required fields are now complete.<br/>
                            You can now access all portfolio features.
                        </div>
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#27ae60',
                confirmButtonText: 'Continue',
                timer: 4000,
                timerProgressBar: true,
                showConfirmButton: true
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