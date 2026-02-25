import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './PasswordManagementTab.css';

const PasswordManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire('Error', 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (userId) => {
    const result = await Swal.fire({
      title: 'Reset User Password',
      text: 'This will set a new temporary password for the user. They will be required to change it on next login.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Reset Password',
      input: 'text',
      inputLabel: 'Temporary Password',
      inputPlaceholder: 'Enter temporary password',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return null;
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            temporaryPassword: result.value
          })
        });

        if (response.ok) {
          Swal.fire('Success', 'Password reset successfully', 'success');
          fetchUsers(); // Refresh user list
        } else {
          throw new Error('Failed to reset password');
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        Swal.fire('Error', 'Failed to reset password', 'error');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Swal.fire('Error', 'Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        Swal.fire('Success', 'Password changed successfully', 'success');
        setShowPasswordModal(false);
        setPasswordForm({
          newPassword: '',
          confirmPassword: ''
        });
        setSelectedUser(null);
        fetchUsers(); // Refresh user list
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire('Error', 'Failed to change password', 'error');
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = (a.isActive ? 1 : -1) - (b.isActive ? 1 : -1);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const facultyUsers = users.filter(u => u.role === 'faculty').length;
    
    return { totalUsers, activeUsers, adminUsers, facultyUsers };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="password-management-tab">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="password-management-tab">
      <div className="tab-header">
        <h2>Password Management</h2>
        <p>Manage user passwords and reset credentials</p>
      </div>

      <div className="stats-section">
        <h3>User Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-content">
              <div className="stat-value">{stats.adminUsers}</div>
              <div className="stat-label">Admins</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <div className="stat-value">{stats.facultyUsers}</div>
              <div className="stat-label">Faculty</div>
            </div>
          </div>
        </div>
      </div>

      <div className="users-section">
        <div className="section-header">
          <h3>Users</h3>
          <div className="filters">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
          </div>
        </div>

        <div className="users-table-container">
          <div className="table-info">
            <span>Total Users: {filteredAndSortedUsers.length}</span>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('role')}
                  >
                    Role
                    {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.length > 0 ? (
                  filteredAndSortedUsers.map(user => (
                    <tr key={user._id} className="user-row">
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="user-name">{user.firstName} {user.lastName}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-reset"
                            onClick={() => handlePasswordReset(user._id)}
                            title="Reset Password"
                          >
                            🔑 Reset
                          </button>
                          <button 
                            className="btn-change"
                            onClick={() => openPasswordModal(user)}
                            title="Change Password"
                          >
                            🔐 Change
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-users">
                      No users found matching current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Password for {selectedUser.firstName} {selectedUser.lastName}</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Department:</strong> {selectedUser.department || 'N/A'}</p>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePasswordChange}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordManagementTab;
