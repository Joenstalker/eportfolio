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

  // Enhanced categorization with status and role grouping
  const categorizedFaculty = filteredFacultyData.reduce((categories, faculty) => {
    const dept = faculty.department || 'Unassigned';
    const status = faculty.isActive ? 'active' : 'inactive';
    const role = faculty.role || 'faculty';
    
    if (!categories[dept]) {
      categories[dept] = {
        active: [],
        inactive: [],
        admin: [],
        faculty: [],
        staff: []
      };
    }
    
    // Add to appropriate sub-category
    categories[dept][status].push(faculty);
    categories[dept][role].push(faculty);
    
    return categories;
  }, {});

  const hasFacultyMembers = Object.keys(categorizedFaculty).length > 0;

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
            Object.entries(categorizedFaculty).map(([department, categories]) => (
              <div key={department} className="faculty-category">
                <div className="faculty-category-header">
                  <h4>{department}</h4>
                  <div className="category-stats">
                    <span className="count-badge">
                      {categories.active.length + categories.inactive.length} total
                    </span>
                    <div className="status-breakdown">
                      <span className="active-count">{categories.active.length} active</span>
                      <span className="inactive-count">{categories.inactive.length} inactive</span>
                    </div>
                  </div>
                </div>

                {/* Active Faculty Table */}
                {categories.active.length > 0 && (
                  <div className="faculty-subsection">
                    <h5>Active Faculty ({categories.active.length})</h5>
                    <table className="faculty-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.active.map((faculty) => {
                          const fullName = `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
                          return (
                            <tr key={faculty._id}>
                              <td>{fullName}</td>
                              <td>{faculty.email}</td>
                              <td>{faculty.role}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="edit-btn"
                                    onClick={() => onEditClick(faculty)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="update-btn"
                                    onClick={() => onArchiveClick(faculty)}
                                  >
                                    Update
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Inactive Faculty Table */}
                {categories.inactive.length > 0 && (
                  <div className="faculty-subsection">
                    <h5>Inactive Faculty ({categories.inactive.length})</h5>
                    <table className="faculty-table inactive">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.inactive.map((faculty) => {
                          const fullName = `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
                          return (
                            <tr key={faculty._id} className="inactive">
                              <td>{fullName}</td>
                              <td>{faculty.email}</td>
                              <td>{faculty.role}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="edit-btn"
                                    onClick={() => onEditClick(faculty)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="update-btn"
                                    onClick={() => onArchiveClick(faculty)}
                                    disabled
                                  >
                                    Archived
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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