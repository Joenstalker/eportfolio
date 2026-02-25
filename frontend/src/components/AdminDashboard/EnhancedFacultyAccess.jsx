import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './EnhancedFacultyAccess.css';

const EnhancedFacultyAccess = ({ user }) => {
  const [activeTab, setActiveTab] = useState('faculty');
  const [facultyList, setFacultyList] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

  // ==================== DATA FETCHING ====================
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFacultyList(data);
      } else {
        throw new Error('Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load faculty list',
        confirmButtonColor: '#d33'
      });
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

  useEffect(() => {
    fetchFaculty();
    fetchPermissions();
  }, []);

  // ==================== EVENT HANDLERS ====================
  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
    setShowPermissionModal(true);
  };

  const handlePermissionToggle = async (facultyId, permissionId, granted) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/faculty/${facultyId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissionId,
          action: granted ? 'grant' : 'revoke'
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Permission Updated',
          text: `Permission ${granted ? 'granted' : 'revoked'} successfully`,
          timer: 2000,
          showConfirmButton: false
        });
        fetchFaculty();
      } else {
        throw new Error('Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update permission',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleBulkPermissionUpdate = async (permissionId, granted) => {
    if (selectedFacultyIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Faculty Selected',
        text: 'Please select faculty members to update permissions',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const result = await Swal.fire({
      title: `Bulk ${granted ? 'Grant' : 'Revoke'} Permission`,
      text: `Are you sure you want to ${granted ? 'grant' : 'revoke'} this permission for ${selectedFacultyIds.length} faculty members?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: granted ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${granted ? 'grant' : 'revoke'}`
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/faculty/bulk-permissions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            facultyIds: selectedFacultyIds,
            permissionId,
            action: granted ? 'grant' : 'revoke'
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Bulk Update Complete',
            text: `Permission ${granted ? 'granted' : 'revoked'} for ${selectedFacultyIds.length} faculty members`,
            timer: 3000,
            showConfirmButton: false
          });
          fetchFaculty();
          setSelectedFacultyIds([]);
          setShowBulkActions(false);
        } else {
          throw new Error('Failed to update permissions');
        }
      } catch (error) {
        console.error('Error updating bulk permissions:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update permissions',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const handleFacultyStatusToggle = async (facultyId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/faculty/${facultyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Faculty status updated to ${newStatus}`,
          timer: 2000,
          showConfirmButton: false
        });
        fetchFaculty();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating faculty status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update faculty status',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleFacultySelectToggle = (facultyId) => {
    setSelectedFacultyIds(prev => 
      prev.includes(facultyId)
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const handleSelectAll = () => {
    const filteredFaculty = getFilteredFaculty();
    if (selectedFacultyIds.length === filteredFaculty.length) {
      setSelectedFacultyIds([]);
    } else {
      setSelectedFacultyIds(filteredFaculty.map(f => f._id));
    }
  };

  // ==================== FILTERING ====================
  const getFilteredFaculty = () => {
    return facultyList.filter(faculty => {
      const matchesSearch = searchTerm === '' || 
        faculty.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = filterDepartment === 'all' || faculty.department === filterDepartment;
      const matchesStatus = filterStatus === 'all' || faculty.status === filterStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(facultyList.map(f => f.department))];
    return departments.filter(dept => dept && dept.trim() !== '');
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderFacultyTab = () => {
    const filteredFaculty = getFilteredFaculty();
    
    return (
      <div className="faculty-access-tab">
        <div className="tab-header">
          <h3>Faculty Access Management</h3>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              📋 Bulk Actions
            </button>
            <button className="btn-primary" onClick={fetchFaculty}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bulk-actions-section">
            <div className="bulk-actions-header">
              <h4>Bulk Permission Management</h4>
              <span className="selected-count">
                {selectedFacultyIds.length} faculty selected
              </span>
            </div>
            
            <div className="bulk-permissions">
              {permissions.map(permission => (
                <div key={permission._id} className="bulk-permission-item">
                  <span className="permission-name">{permission.name}</span>
                  <div className="bulk-buttons">
                    <button
                      className="btn-grant"
                      onClick={() => handleBulkPermissionUpdate(permission._id, true)}
                      disabled={selectedFacultyIds.length === 0}
                    >
                      Grant All
                    </button>
                    <button
                      className="btn-revoke"
                      onClick={() => handleBulkPermissionUpdate(permission._id, false)}
                      disabled={selectedFacultyIds.length === 0}
                    >
                      Revoke All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faculty List */}
        <div className="faculty-list">
          <div className="list-header">
            {showBulkActions && (
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={selectedFacultyIds.length === filteredFaculty.length && filteredFaculty.length > 0}
                  onChange={handleSelectAll}
                />
                <label>Select All</label>
              </div>
            )}
            <div className="list-stats">
              <span>{filteredFaculty.length} faculty members</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading faculty...</p>
            </div>
          ) : (
            <div className="faculty-grid">
              {filteredFaculty.map(faculty => (
                <div key={faculty._id} className="faculty-card">
                  <div className="faculty-header">
                    <div className="faculty-info">
                      {showBulkActions && (
                        <input
                          type="checkbox"
                          checked={selectedFacultyIds.includes(faculty._id)}
                          onChange={() => handleFacultySelectToggle(faculty._id)}
                          className="faculty-checkbox"
                        />
                      )}
                      <div className="faculty-avatar">
                        {faculty.firstName.charAt(0)}{faculty.lastName.charAt(0)}
                      </div>
                      <div className="faculty-details">
                        <h4>{faculty.firstName} {faculty.lastName}</h4>
                        <p>{faculty.email}</p>
                        <span className={`status-badge ${faculty.status}`}>
                          {faculty.status}
                        </span>
                      </div>
                    </div>
                    <div className="faculty-actions">
                      <button
                        className="btn-permissions"
                        onClick={() => handleFacultySelect(faculty)}
                      >
                        🔐 Permissions
                      </button>
                      <select
                        value={faculty.status}
                        onChange={(e) => handleFacultyStatusToggle(faculty._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="faculty-permissions">
                    <h5>Current Permissions</h5>
                    <div className="permission-tags">
                      {faculty.permissions && faculty.permissions.length > 0 ? (
                        faculty.permissions.map((perm, index) => (
                          <span key={index} className="permission-tag">
                            {perm.name || perm}
                          </span>
                        ))
                      ) : (
                        <span className="no-permissions">No permissions assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="faculty-meta">
                    <span className="department">{faculty.department}</span>
                    <span className="courses">{faculty.assignedCourses?.length || 0} courses</span>
                    <span className="last-login">
                      Last login: {faculty.lastLogin ? new Date(faculty.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredFaculty.length === 0 && (
            <div className="empty-state">
              <p>No faculty found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPermissionMatrix = () => {
    const filteredFaculty = getFilteredFaculty();
    
    return (
      <div className="permission-matrix-tab">
        <div className="tab-header">
          <h3>Permission Matrix</h3>
          <button className="btn-primary" onClick={fetchFaculty}>
            🔄 Refresh
          </button>
        </div>

        <div className="matrix-container">
          <div className="matrix-table">
            <div className="matrix-header">
              <div className="matrix-cell">Faculty</div>
              {permissions.map(permission => (
                <div key={permission._id} className="matrix-cell permission-header">
                  <div className="permission-name">{permission.name}</div>
                  <div className="permission-category">{permission.category}</div>
                </div>
              ))}
            </div>

            <div className="matrix-body">
              {filteredFaculty.map(faculty => (
                <div key={faculty._id} className="matrix-row">
                  <div className="matrix-cell faculty-name">
                    <div className="faculty-mini-info">
                      <div className="mini-avatar">
                        {faculty.firstName.charAt(0)}{faculty.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="mini-name">
                          {faculty.firstName} {faculty.lastName}
                        </div>
                        <div className="mini-department">{faculty.department}</div>
                      </div>
                    </div>
                  </div>
                  
                  {permissions.map(permission => {
                    const hasPermission = faculty.permissions?.some(p => 
                      (p._id && p._id === permission._id) || 
                      (p.name && p.name === permission.name) ||
                      p === permission.name
                    );
                    
                    return (
                      <div key={permission._id} className="matrix-cell">
                        <button
                          className={`matrix-checkbox ${hasPermission ? 'granted' : 'denied'}`}
                          onClick={() => handlePermissionToggle(faculty._id, permission._id, !hasPermission)}
                        >
                          {hasPermission ? '✓' : '✗'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPermissionAnalytics = () => {
    // Calculate permission statistics
    const totalFaculty = facultyList.length;
    const permissionStats = permissions.map(permission => {
      const grantedCount = facultyList.filter(faculty => 
        faculty.permissions?.some(p => 
          (p._id && p._id === permission._id) || 
          (p.name && p.name === permission.name) ||
          p === permission.name
        )
      ).length;
      
      return {
        ...permission,
        grantedCount,
        deniedCount: totalFaculty - grantedCount,
        percentage: totalFaculty > 0 ? Math.round((grantedCount / totalFaculty) * 100) : 0
      };
    });

    return (
      <div className="permission-analytics-tab">
        <div className="tab-header">
          <h3>Permission Analytics</h3>
          <button className="btn-primary" onClick={fetchFaculty}>
            🔄 Refresh
          </button>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Permission Distribution</h4>
            <div className="permission-bars">
              {permissionStats.map(stat => (
                <div key={stat._id} className="permission-bar-item">
                  <div className="permission-info">
                    <span className="permission-name">{stat.name}</span>
                    <span className="permission-stats">
                      {stat.grantedCount}/{totalFaculty} ({stat.percentage}%)
                    </span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <h4>Department Analysis</h4>
            <div className="department-stats">
              {getUniqueDepartments().map(dept => {
                const deptFaculty = facultyList.filter(f => f.department === dept);
                const deptPermissions = deptFaculty.reduce((sum, faculty) => 
                  sum + (faculty.permissions?.length || 0), 0
                );
                
                return (
                  <div key={dept} className="department-stat-item">
                    <span className="department-name">{dept}</span>
                    <span className="department-count">{deptFaculty.length} faculty</span>
                    <span className="department-permissions">{deptPermissions} permissions</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-card">
            <h4>Summary Statistics</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Faculty</span>
                <span className="stat-value">{totalFaculty}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Permissions</span>
                <span className="stat-value">{permissions.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Permissions per Faculty</span>
                <span className="stat-value">
                  {totalFaculty > 0 ? 
                    Math.round(facultyList.reduce((sum, f) => sum + (f.permissions?.length || 0), 0) / totalFaculty) 
                    : 0
                  }
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Most Common Permission</span>
                <span className="stat-value">
                  {permissionStats.length > 0 ? 
                    permissionStats.reduce((max, stat) => 
                      stat.grantedCount > max.grantedCount ? stat : max
                    ).name 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-faculty-access">
      <div className="dashboard-header">
        <h2>Enhanced Faculty Access Controls</h2>
        <p>Comprehensive permission management for faculty members</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          👥 Faculty Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          📊 Permission Matrix
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'faculty' && renderFacultyTab()}
        {activeTab === 'matrix' && renderPermissionMatrix()}
        {activeTab === 'analytics' && renderPermissionAnalytics()}
      </div>

      {/* Permission Modal */}
      {showPermissionModal && selectedFaculty && (
        <div className="modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div className="modal-content permission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Permissions</h3>
              <div className="faculty-modal-info">
                <div className="modal-avatar">
                  {selectedFaculty.firstName.charAt(0)}{selectedFaculty.lastName.charAt(0)}
                </div>
                <div>
                  <div className="modal-faculty-name">
                    {selectedFaculty.firstName} {selectedFaculty.lastName}
                  </div>
                  <div className="modal-faculty-email">{selectedFaculty.email}</div>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowPermissionModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="permission-categories">
                {permissions.reduce((categories, permission) => {
                  if (!categories[permission.category]) {
                    categories[permission.category] = [];
                  }
                  categories[permission.category].push(permission);
                  return categories;
                }, {}).map((categoryPermissions, category) => (
                  <div key={category} className="permission-category">
                    <h4>{category}</h4>
                    <div className="permission-list">
                      {categoryPermissions.map(permission => {
                        const hasPermission = selectedFaculty.permissions?.some(p => 
                          (p._id && p._id === permission._id) || 
                          (p.name && p.name === permission.name) ||
                          p === permission.name
                        );
                        
                        return (
                          <div key={permission._id} className="permission-item">
                            <div className="permission-info">
                              <div className="permission-name">{permission.name}</div>
                              <div className="permission-description">{permission.description}</div>
                            </div>
                            <button
                              className={`permission-toggle ${hasPermission ? 'granted' : 'denied'}`}
                              onClick={() => handlePermissionToggle(selectedFaculty._id, permission._id, !hasPermission)}
                            >
                              {hasPermission ? '✓ Granted' : '✗ Denied'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFacultyAccess;
