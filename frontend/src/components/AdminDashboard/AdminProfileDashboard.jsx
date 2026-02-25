import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './AdminProfileDashboard.css';

const AdminProfileDashboard = ({ user, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    position: user.position || '',
    bio: user.bio || '',
    officeLocation: user.officeLocation || '',
    officeHours: user.officeHours || '',
    specialization: user.specialization || '',
    researchInterests: user.researchInterests || '',
    education: user.education || [],
    experience: user.experience || [],
    publications: user.publications || [],
    achievements: user.achievements || []
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ==================== EVENT HANDLERS ====================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been updated successfully!',
          timer: 3000,
          showConfirmButton: false
        });
        
        if (onProfileUpdate) {
          onProfileUpdate({ ...user, ...profileData });
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update profile. Please try again.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Password Too Short',
        text: 'Password must be at least 8 characters long.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          text: 'Your password has been changed successfully!',
          timer: 3000,
          showConfirmButton: false
        });
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Password Change Failed',
        text: 'Failed to change password. Please check your current password.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = () => {
    const newEducation = {
      degree: '',
      institution: '',
      year: '',
      field: '',
      gpa: ''
    };
    setProfileData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const handleRemoveEducation = (index) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleAddExperience = () => {
    const newExperience = {
      position: '',
      organization: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setProfileData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const handleRemoveExperience = (index) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateExperience = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const handleAddPublication = () => {
    const newPublication = {
      title: '',
      authors: '',
      journal: '',
      year: '',
      doi: '',
      type: 'Journal Article'
    };
    setProfileData(prev => ({
      ...prev,
      publications: [...prev.publications, newPublication]
    }));
  };

  const handleRemovePublication = (index) => {
    setProfileData(prev => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index)
    }));
  };

  const handleUpdatePublication = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      publications: prev.publications.map((pub, i) => 
        i === index ? { ...pub, [field]: value } : pub
      )
    }));
  };

  const handleAddAchievement = () => {
    const newAchievement = {
      title: '',
      description: '',
      date: '',
      category: 'Academic'
    };
    setProfileData(prev => ({
      ...prev,
      achievements: [...prev.achievements, newAchievement]
    }));
  };

  const handleRemoveAchievement = (index) => {
    setProfileData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateAchievement = (index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      achievements: prev.achievements.map((ach, i) => 
        i === index ? { ...ach, [field]: value } : ach
      )
    }));
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
          </div>
          <button className="avatar-change-btn">
            📷 Change Photo
          </button>
        </div>
        <div className="profile-info">
          <h2>{profileData.firstName} {profileData.lastName}</h2>
          <p className="profile-title">{profileData.position || 'Administrator'}</p>
          <p className="profile-department">{profileData.department || 'System Administration'}</p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleProfileUpdate}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={profileData.department}
                onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                value={profileData.position}
                onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Professional Information</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="form-group">
              <label>Office Location</label>
              <input
                type="text"
                value={profileData.officeLocation}
                onChange={(e) => setProfileData(prev => ({ ...prev, officeLocation: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Office Hours</label>
              <input
                type="text"
                value={profileData.officeHours}
                onChange={(e) => setProfileData(prev => ({ ...prev, officeHours: e.target.value }))}
                placeholder="e.g., Mon-Wed 9:00 AM - 5:00 PM"
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                value={profileData.specialization}
                onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Research Interests</label>
              <input
                type="text"
                value={profileData.researchInterests}
                onChange={(e) => setProfileData(prev => ({ ...prev, researchInterests: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(true)}>
            🔐 Change Password
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderEducationTab = () => (
    <div className="education-tab">
      <div className="tab-header">
        <h3>Education Background</h3>
        <button className="btn-primary" onClick={handleAddEducation}>
          ➕ Add Education
        </button>
      </div>

      <div className="education-list">
        {profileData.education.map((edu, index) => (
          <div key={index} className="education-item">
            <div className="education-header">
              <h4>{edu.degree || 'New Education'}</h4>
              <button 
                className="btn-delete"
                onClick={() => handleRemoveEducation(index)}
              >
                🗑️
              </button>
            </div>
            <div className="education-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                  />
                </div>
                <div className="form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleUpdateEducation(index, 'institution', e.target.value)}
                    placeholder="e.g., University of Example"
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => handleUpdateEducation(index, 'year', e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>
                <div className="form-group">
                  <label>Field of Study</label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => handleUpdateEducation(index, 'field', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="form-group">
                  <label>GPA</label>
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => handleUpdateEducation(index, 'gpa', e.target.value)}
                    placeholder="e.g., 3.8"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {profileData.education.length === 0 && (
          <div className="empty-state">
            <p>No education records added yet.</p>
            <button className="btn-primary" onClick={handleAddEducation}>
              ➕ Add Your First Education
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderExperienceTab = () => (
    <div className="experience-tab">
      <div className="tab-header">
        <h3>Work Experience</h3>
        <button className="btn-primary" onClick={handleAddExperience}>
          ➕ Add Experience
        </button>
      </div>

      <div className="experience-list">
        {profileData.experience.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="experience-header">
              <h4>{exp.position || 'New Experience'}</h4>
              <button 
                className="btn-delete"
                onClick={() => handleRemoveExperience(index)}
              >
                🗑️
              </button>
            </div>
            <div className="experience-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => handleUpdateExperience(index, 'position', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={exp.organization}
                    onChange={(e) => handleUpdateExperience(index, 'organization', e.target.value)}
                    placeholder="e.g., Tech Company Inc."
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => handleUpdateExperience(index, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => handleUpdateExperience(index, 'endDate', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {profileData.experience.length === 0 && (
          <div className="empty-state">
            <p>No work experience added yet.</p>
            <button className="btn-primary" onClick={handleAddExperience}>
              ➕ Add Your First Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPublicationsTab = () => (
    <div className="publications-tab">
      <div className="tab-header">
        <h3>Publications</h3>
        <button className="btn-primary" onClick={handleAddPublication}>
          ➕ Add Publication
        </button>
      </div>

      <div className="publications-list">
        {profileData.publications.map((pub, index) => (
          <div key={index} className="publication-item">
            <div className="publication-header">
              <h4>{pub.title || 'New Publication'}</h4>
              <button 
                className="btn-delete"
                onClick={() => handleRemovePublication(index)}
              >
                🗑️
              </button>
            </div>
            <div className="publication-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Title</label>
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => handleUpdatePublication(index, 'title', e.target.value)}
                    placeholder="Publication title"
                  />
                </div>
                <div className="form-group">
                  <label>Authors</label>
                  <input
                    type="text"
                    value={pub.authors}
                    onChange={(e) => handleUpdatePublication(index, 'authors', e.target.value)}
                    placeholder="Author names"
                  />
                </div>
                <div className="form-group">
                  <label>Journal/Conference</label>
                  <input
                    type="text"
                    value={pub.journal}
                    onChange={(e) => handleUpdatePublication(index, 'journal', e.target.value)}
                    placeholder="Journal or conference name"
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={pub.year}
                    onChange={(e) => handleUpdatePublication(index, 'year', e.target.value)}
                    placeholder="Publication year"
                  />
                </div>
                <div className="form-group">
                  <label>DOI</label>
                  <input
                    type="text"
                    value={pub.doi}
                    onChange={(e) => handleUpdatePublication(index, 'doi', e.target.value)}
                    placeholder="DOI (if available)"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={pub.type}
                    onChange={(e) => handleUpdatePublication(index, 'type', e.target.value)}
                  >
                    <option value="Journal Article">Journal Article</option>
                    <option value="Conference Paper">Conference Paper</option>
                    <option value="Book Chapter">Book Chapter</option>
                    <option value="Book">Book</option>
                    <option value="Thesis">Thesis</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {profileData.publications.length === 0 && (
          <div className="empty-state">
            <p>No publications added yet.</p>
            <button className="btn-primary" onClick={handleAddPublication}>
              ➕ Add Your First Publication
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="achievements-tab">
      <div className="tab-header">
        <h3>Achievements & Awards</h3>
        <button className="btn-primary" onClick={handleAddAchievement}>
          ➕ Add Achievement
        </button>
      </div>

      <div className="achievements-list">
        {profileData.achievements.map((ach, index) => (
          <div key={index} className="achievement-item">
            <div className="achievement-header">
              <h4>{ach.title || 'New Achievement'}</h4>
              <button 
                className="btn-delete"
                onClick={() => handleRemoveAchievement(index)}
              >
                🗑️
              </button>
            </div>
            <div className="achievement-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={ach.title}
                    onChange={(e) => handleUpdateAchievement(index, 'title', e.target.value)}
                    placeholder="Achievement title"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={ach.category}
                    onChange={(e) => handleUpdateAchievement(index, 'category', e.target.value)}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Professional">Professional</option>
                    <option value="Research">Research</option>
                    <option value="Service">Service</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={ach.date}
                    onChange={(e) => handleUpdateAchievement(index, 'date', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={ach.description}
                    onChange={(e) => handleUpdateAchievement(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="Describe the achievement..."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {profileData.achievements.length === 0 && (
          <div className="empty-state">
            <p>No achievements added yet.</p>
            <button className="btn-primary" onClick={handleAddAchievement}>
              ➕ Add Your First Achievement
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-profile-dashboard">
      <div className="dashboard-header">
        <h2>Profile Management</h2>
        <p>Manage your personal information and professional details</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Basic Profile
        </button>
        <button 
          className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          🎓 Education
        </button>
        <button 
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          💼 Experience
        </button>
        <button 
          className={`tab-btn ${activeTab === 'publications' ? 'active' : ''}`}
          onClick={() => setActiveTab('publications')}
        >
          📚 Publications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'education' && renderEducationTab()}
        {activeTab === 'experience' && renderExperienceTab()}
        {activeTab === 'publications' && renderPublicationsTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            
            <form className="password-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={8}
                />
                <small>Password must be at least 8 characters long</small>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileDashboard;
