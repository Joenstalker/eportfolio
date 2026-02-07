import React from 'react';
import './FacultyManagementTab.css';

const FacultyManagementTab = ({
  loading,
  facultyData,
  filterDept,
  setFilterDept,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  onAddFacultyClick,
  onEditClick,
  onArchiveClick
}) => {
  // Filter faculty data based on all criteria
  const filteredFacultyData = facultyData.filter((f) => {
    // Apply department filter
    if (filterDept !== 'all' && f.department !== filterDept) return false;
    
    // Apply role filter
    if (filterRole !== 'all' && f.role !== filterRole) return false;
    
    // Apply status filter
    const status = f.isActive ? 'active' : 'inactive';
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    
    // Apply search term filter
    const fullName = `${f.firstName} ${f.lastName}`.toLowerCase();
    if (searchTerm && 
        !fullName.includes(searchTerm.toLowerCase()) && 
        !f.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Group faculty by department after filtering
  const groupedFaculty = filteredFacultyData.reduce((groups, faculty) => {
    const dept = faculty.department || 'Unassigned';
    if (!groups[dept]) groups[dept] = [];
    groups[dept].push(faculty);
    return groups;
  }, {});

  const hasFacultyMembers = Object.keys(groupedFaculty).length > 0;

  return (
    <div className="faculty-management">
      <div className="section-header">
        <h3>Faculty Members</h3>
        <div className="header-actions">
          <select
            className="faculty-filter-select"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {[...new Set(facultyData.map((f) => f.department).filter(Boolean))].map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            className="faculty-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
            <option value="hod">Head of Department</option>
          </select>

          <select
            className="faculty-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <input
            type="text"
            className="faculty-search-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button className="add-faculty-btn" onClick={onAddFacultyClick}>
            + Add Faculty
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading faculty data...</div>
      ) : (
        <div className="faculty-table-container">
          {hasFacultyMembers ? (
            Object.entries(groupedFaculty).map(([department, members]) => (
              <div key={department} className="faculty-category">
                <div className="faculty-category-header">
                  <h4>{department}</h4>
                  <span className="count-badge">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <table className="faculty-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((faculty) => {
                      const status = faculty.isActive ? 'active' : 'inactive';
                      const fullName = `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
                      return (
                      <tr
                        key={faculty._id}
                        className={status === 'inactive' ? 'inactive' : ''}
                      >
                        <td>{fullName}</td>
                        <td>{faculty.email}</td>
                        <td>{faculty.role}</td>
                        <td>
                          <span className={`status-badge ${status}`}>{status}</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => onEditClick(faculty)}
                            >
                              Edit
                            </button>
                            <button
                              className="status-btn"
                              onClick={() => onArchiveClick(faculty)}
                              disabled={status === 'inactive'}
                            >
                              {status === 'inactive' ? 'Archived' : 'Archive'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="empty-state">No faculty members found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyManagementTab;