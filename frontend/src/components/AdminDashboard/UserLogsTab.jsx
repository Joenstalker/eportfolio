import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './UserLogsTab.css';

const UserLogsTab = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    action: 'all',
    resourceType: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

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
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => 
            value && value !== 'all' && key !== 'search'
          )
        )
      });

      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      const response = await fetch(`/api/admin/activities?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0
        }));
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      showErrorAlert('Failed to load user activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [pagination.page, sortBy, sortOrder, filters]);

  // ==================== EVENT HANDLERS ====================
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => 
            value && value !== 'all'
          )
        )
      });

      const response = await fetch(`/api/admin/activities/export?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-activities-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccessAlert('Activities exported successfully');
      } else {
        throw new Error('Failed to export activities');
      }
    } catch (error) {
      console.error('Error exporting activities:', error);
      showErrorAlert('Failed to export activities');
    }
  };

  const handleClearLogs = async () => {
    const result = await Swal.fire({
      title: 'Clear Activity Logs?',
      text: 'This will permanently delete all activity logs. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Clear Logs',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/admin/activities/clear', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setActivities([]);
          setPagination(prev => ({ ...prev, total: 0 }));
          showSuccessAlert('Activity logs cleared successfully');
        } else {
          throw new Error('Failed to clear logs');
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
        showErrorAlert('Failed to clear activity logs');
      }
    }
  };

  // ==================== RENDER FUNCTIONS ====================
  const getActivityIcon = (action) => {
    const icons = {
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'PROFILE_UPDATE': '👤',
      'COURSE_CREATE': '📚',
      'COURSE_UPDATE': '✏️',
      'COURSE_DELETE': '🗑️',
      'FACULTY_CREATE': '👥',
      'FACULTY_UPDATE': '✏️',
      'FACULTY_ARCHIVE': '📦',
      'FACULTY_UNARCHIVE': '📂',
      'ASSIGNMENT_CREATE': '📋',
      'ASSIGNMENT_UPDATE': '✏️',
      'ASSIGNMENT_DELETE': '🗑️',
      'FILE_UPLOAD': '📁',
      'FILE_DELETE': '🗑️',
      'REPORT_GENERATE': '📊',
      'SEMINAR_CREATE': '🎤',
      'SEMINAR_UPDATE': '✏️',
      'SEMINAR_DELETE': '🗑️',
      'RESEARCH_CREATE': '🔬',
      'RESEARCH_UPDATE': '✏️',
      'RESEARCH_DELETE': '🗑️'
    };
    return icons[action] || '📝';
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      'LOGIN': 'success',
      'LOGOUT': 'info',
      'PROFILE_UPDATE': 'warning',
      'COURSE_CREATE': 'success',
      'COURSE_UPDATE': 'warning',
      'COURSE_DELETE': 'danger',
      'FACULTY_CREATE': 'success',
      'FACULTY_UPDATE': 'warning',
      'FACULTY_ARCHIVE': 'warning',
      'FACULTY_UNARCHIVE': 'success',
      'ASSIGNMENT_CREATE': 'success',
      'ASSIGNMENT_UPDATE': 'warning',
      'ASSIGNMENT_DELETE': 'danger',
      'FILE_UPLOAD': 'info',
      'FILE_DELETE': 'danger',
      'REPORT_GENERATE': 'info',
      'SEMINAR_CREATE': 'success',
      'SEMINAR_UPDATE': 'warning',
      'SEMINAR_DELETE': 'danger',
      'RESEARCH_CREATE': 'success',
      'RESEARCH_UPDATE': 'warning',
      'RESEARCH_DELETE': 'danger'
    };
    return colors[action] || 'secondary';
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return '-';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const renderActivityRow = (activity) => (
    <tr key={activity._id} className="activity-row">
      <td>
        <span className="activity-icon">
          {getActivityIcon(activity.action)}
        </span>
        <span className={`action-badge ${getActionBadgeColor(activity.action)}`}>
          {activity.action.replace(/_/g, ' ')}
        </span>
      </td>
      <td>
        {activity.userId ? (
          <>
            <div className="user-info">
              <strong>{activity.userId.firstName} {activity.userId.lastName}</strong>
              <div className="user-email">{activity.userId.email}</div>
            </div>
          </>
        ) : 'Unknown User'}
      </td>
      <td>{activity.description}</td>
      <td>
        <span className="resource-type">
          {activity.resourceType || '-'}
        </span>
      </td>
      <td>{formatDuration(activity.duration)}</td>
      <td>
        <span className={`status-indicator ${activity.success ? 'success' : 'error'}`}>
          {activity.success ? '✅ Success' : '❌ Failed'}
        </span>
        {activity.errorMessage && (
          <div className="error-message">{activity.errorMessage}</div>
        )}
      </td>
      <td>
        <div className="timestamp-info">
          <div className="date">
            {new Date(activity.timestamp).toLocaleDateString()}
          </div>
          <div className="time">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </td>
      <td>
        <div className="ip-info">
          <div className="ip-address">{activity.ipAddress || '-'}</div>
          {activity.userAgent && (
            <div className="user-agent" title={activity.userAgent}>
              {activity.userAgent.length > 30 
                ? `${activity.userAgent.substring(0, 30)}...`
                : activity.userAgent
              }
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return <div className="loading">Loading user activities...</div>;
  }

  return (
    <div className="user-logs-tab">
      <div className="logs-header">
        <h2>User Activity Logs</h2>
        <div className="header-actions">
          <button 
            className="btn-export"
            onClick={handleExportLogs}
            disabled={activities.length === 0}
          >
            📊 Export CSV
          </button>
          <button 
            className="btn-clear"
            onClick={handleClearLogs}
            disabled={activities.length === 0}
          >
            🗑️ Clear Logs
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Action:</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="PROFILE_UPDATE">Profile Update</option>
              <option value="COURSE_CREATE">Course Create</option>
              <option value="COURSE_UPDATE">Course Update</option>
              <option value="COURSE_DELETE">Course Delete</option>
              <option value="FACULTY_CREATE">Faculty Create</option>
              <option value="FACULTY_UPDATE">Faculty Update</option>
              <option value="FILE_UPLOAD">File Upload</option>
              <option value="REPORT_GENERATE">Report Generate</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Resource:</label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            >
              <option value="all">All Resources</option>
              <option value="USER">User</option>
              <option value="COURSE">Course</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="FILE">File</option>
              <option value="SEMINAR">Seminar</option>
              <option value="RESEARCH">Research</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range:</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                placeholder="Start date"
              />
              <span>to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="activities-table-container">
        <div className="table-info">
          <span>Total Activities: {pagination.total}</span>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
        </div>

        <div className="activities-table">
          <table>
            <thead>
              <tr>
                <th 
                  className="sortable"
                  onClick={() => handleSort('action')}
                >
                  Action
                  {sortBy === 'action' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>User</th>
                <th>Description</th>
                <th>Resource</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('duration')}
                >
                  Duration
                  {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp
                  {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>IP / User Agent</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map(renderActivityRow)
              ) : (
                <tr>
                  <td colSpan="8" className="no-activities">
                    No activities found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.total > pagination.limit && (
          <div className="pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLogsTab;
