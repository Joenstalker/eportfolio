import React from 'react';
import './FacultyManagementTab.css';

const FacultyManagementTab = ({
  loading,
  facultyData,
  filterDept,
  setFilterDept,
  onAddFacultyClick,
  onEditClick,
  onArchiveClick
}) => {
  return (
    <div className="faculty-management">
      <div className="section-header">
        <h3>Faculty Members (Categorized)</h3>
        <div className="header-actions">
          {/* Department Filter */}
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

          <button className="add-faculty-btn" onClick={onAddFacultyClick}>
            + Add Faculty
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading faculty data...</div>
      ) : (
        <div className="faculty-table-container">
          {Object.entries(
            (
              filterDept === 'all'
                ? facultyData
                : facultyData.filter((f) => f.department === filterDept)
            )
              // Show only active users in Faculty Management
              .filter((f) => f.status === 'active')
              .reduce((groups, faculty) => {
                const dept = faculty.department || 'Unassigned';
                if (!groups[dept]) groups[dept] = [];
                groups[dept].push(faculty);
                return groups;
              }, {})
          ).map(([department, members]) => (
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
                  {members.map((faculty) => (
                    <tr
                      key={faculty._id}
                      className={faculty.status === 'inactive' ? 'inactive' : ''}
                    >
                      <td>{faculty.name}</td>
                      <td>{faculty.email}</td>
                      <td>{faculty.role}</td>
                      <td>
                        <span className={`status-badge ${faculty.status}`}>{faculty.status}</span>
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
                            disabled={faculty.status === 'inactive'}
                          >
                            {faculty.status === 'inactive' ? 'Archived' : 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {facultyData.filter((f) => f.status === 'active').length === 0 && (
            <div className="empty-state">No faculty members found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyManagementTab;

