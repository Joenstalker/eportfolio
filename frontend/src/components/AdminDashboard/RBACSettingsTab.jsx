import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './RBACSettingsTab.css';

const RBACSettingsTab = ({ user }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');
  const [systemSettings, setSystemSettings] = useState({
    selfRegistrationEnabled: false,
    adminApprovalRequired: true,
    defaultRole: 'FACULTY'
  });

  // ==================== HELPER FUNCTIONS ====================
  const showSuccessAlert = (message, title = 'Success') => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const showErrorAlert = (message, title = 'Error') => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonColor: '#d33'
    });
  };

  // ==================== DATA FETCHING ====================
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rbac/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        throw new Error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showErrorAlert('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rbac/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rbac/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchSystemSettings();
  }, []);

  // ==================== EVENT HANDLERS ====================
  const handleCreateRole = async () => {
    const { value: roleName } = await Swal.fire({
      title: 'Create New Role',
      input: 'text',
      inputLabel: 'Role Name',
      inputPlaceholder: 'Enter role name',
      showCancelButton: true,
      confirmButtonText: 'Create',
      confirmButtonColor: '#3b82f6'
    });

    if (roleName) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/rbac/roles', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: roleName.toUpperCase().replace(/\s+/g, '_'),
            description: `Custom role: ${roleName}`,
            level: 50,
            permissions: []
          })
        });

        if (response.ok) {
          showSuccessAlert('Role created successfully');
          fetchRoles();
        } else {
          throw new Error('Failed to create role');
        }
      } catch (error) {
        console.error('Error creating role:', error);
        showErrorAlert('Failed to create role');
      }
    }
  };

  const handleUpdateRole = async (roleId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/rbac/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        showSuccessAlert('Role updated successfully');
        fetchRoles();
        setSelectedRole(null);
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showErrorAlert('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    const result = await Swal.fire({
      title: 'Delete Role?',
      text: 'This will permanently delete the role and remove all permissions. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/rbac/roles/${roleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          showSuccessAlert('Role deleted successfully');
          fetchRoles();
          setSelectedRole(null);
        } else {
          throw new Error('Failed to delete role');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        showErrorAlert('Failed to delete role');
      }
    }
  };

  const handlePermissionToggle = async (roleId, permissionId) => {
    try {
      const token = localStorage.getItem('token');
      const role = roles.find(r => r._id === roleId);
      const hasPermission = role.permissions.includes(permissionId);
      
      const response = await fetch(`/api/admin/rbac/roles/${roleId}/permissions`, {
        method: hasPermission ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissionId })
      });

      if (response.ok) {
        showSuccessAlert(`Permission ${hasPermission ? 'removed' : 'added'} successfully`);
        fetchRoles();
      } else {
        throw new Error(`Failed to ${hasPermission ? 'remove' : 'add'} permission`);
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      showErrorAlert(`Failed to ${hasPermission ? 'remove' : 'add'} permission`);
    }
  };

  const handleUpdateSystemSettings = async (settings) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rbac/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showSuccessAlert('System settings updated successfully');
        setSystemSettings(settings);
      } else {
        throw new Error('Failed to update system settings');
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      showErrorAlert('Failed to update system settings');
    }
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderRolesTab = () => (
    <div className="rbac-roles">
      <div className="section-header">
        <h3>Role Management</h3>
        <button className="btn-primary" onClick={handleCreateRole}>
          ➕ Create Role
        </button>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role._id} className="role-card">
            <div className="role-header">
              <h4>{role.name.replace(/_/g, ' ')}</h4>
              <div className="role-level">Level {role.level}</div>
            </div>
            
            <div className="role-details">
              <p>{role.description}</p>
              <div className="role-stats">
                <span>📋 {role.permissions.length} permissions</span>
                <span>👥 {role.departmentAccess.length} departments</span>
              </div>
            </div>

            <div className="role-actions">
              <button 
                className="btn-edit"
                onClick={() => setSelectedRole(role)}
              >
                ✏️ Edit
              </button>
              {role.name !== 'SUPER_ADMIN' && (
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteRole(role._id)}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRole && (
        <div className="role-editor-modal">
          <div className="modal-overlay" onClick={() => setSelectedRole(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Role: {selectedRole.name.replace(/_/g, ' ')}</h3>
                <button className="close-btn" onClick={() => setSelectedRole(null)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name</label>
                  <input
                    type="text"
                    value={selectedRole.name}
                    onChange={(e) => setSelectedRole(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    disabled={selectedRole.name === 'SUPER_ADMIN'}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={selectedRole.description}
                    onChange={(e) => setSelectedRole(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Access Level</label>
                  <input
                    type="number"
                    value={selectedRole.level}
                    onChange={(e) => setSelectedRole(prev => ({
                      ...prev,
                      level: parseInt(e.target.value)
                    }))}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Department Access</label>
                  <div className="department-checkboxes">
                    {['Computer Science', 'Information Technology', 'Engineering', 'Business', 'Arts', 'Science', 'Mathematics'].map(dept => (
                      <label key={dept} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedRole.departmentAccess.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRole(prev => ({
                                ...prev,
                                departmentAccess: [...prev.departmentAccess, dept]
                              }));
                            } else {
                              setSelectedRole(prev => ({
                                ...prev,
                                departmentAccess: prev.departmentAccess.filter(d => d !== dept)
                              }));
                            }
                          }}
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedRole.canSelfRegister}
                      onChange={(e) => setSelectedRole(prev => ({
                        ...prev,
                        canSelfRegister: e.target.checked
                      }))}
                    />
                    Allow Self Registration
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedRole.requiresAdminApproval}
                      onChange={(e) => setSelectedRole(prev => ({
                        ...prev,
                        requiresAdminApproval: e.target.checked
                      }))}
                    />
                    Requires Admin Approval
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-cancel"
                  onClick={() => setSelectedRole(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleUpdateRole(selectedRole._id, selectedRole)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => {
    const permissionsByCategory = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});

    return (
      <div className="rbac-permissions">
        <div className="section-header">
          <h3>Permission Management</h3>
        </div>

        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <div key={category} className="permission-category">
            <h4>{category}</h4>
            <div className="permissions-grid">
              {categoryPermissions.map(permission => (
                <div key={permission._id} className="permission-item">
                  <div className="permission-info">
                    <div className="permission-name">{permission.name}</div>
                    <div className="permission-description">{permission.description}</div>
                  </div>
                  <div className="permission-badge">
                    {permission.isDefault && <span className="default-badge">DEFAULT</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
  );

  const renderSystemSettingsTab = () => (
    <div className="rbac-settings">
      <div className="section-header">
        <h3>System Settings</h3>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <h4>Self Registration</h4>
          <p>Allow users to register themselves without admin approval</p>
          <div className="setting-control">
            <label className="switch">
              <input
                type="checkbox"
                checked={systemSettings.selfRegistrationEnabled}
                onChange={(e) => handleUpdateSystemSettings({
                  ...systemSettings,
                  selfRegistrationEnabled: e.target.checked
                })}
              />
              <span className="slider"></span>
            </label>
            <span className="setting-status">
              {systemSettings.selfRegistrationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="setting-card">
          <h4>Admin Approval</h4>
          <p>Require admin approval for new user registrations</p>
          <div className="setting-control">
            <label className="switch">
              <input
                type="checkbox"
                checked={systemSettings.adminApprovalRequired}
                onChange={(e) => handleUpdateSystemSettings({
                  ...systemSettings,
                  adminApprovalRequired: e.target.checked
                })}
              />
              <span className="slider"></span>
            </label>
            <span className="setting-status">
              {systemSettings.adminApprovalRequired ? 'Required' : 'Not Required'}
            </span>
          </div>
        </div>

        <div className="setting-card">
          <h4>Default Role</h4>
          <p>Default role assigned to new users</p>
          <div className="setting-control">
            <select
              value={systemSettings.defaultRole}
              onChange={(e) => handleUpdateSystemSettings({
                ...systemSettings,
                defaultRole: e.target.value
              })}
            >
              <option value="FACULTY">Faculty</option>
              <option value="STAFF">Staff</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading RBAC settings...</div>;
  }

  return (
    <div className="rbac-settings-tab">
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          System Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'roles' && renderRolesTab()}
        {activeTab === 'permissions' && renderPermissionsTab()}
        {activeTab === 'settings' && renderSystemSettingsTab()}
      </div>
    </div>
  );
};

export default RBACSettingsTab;
