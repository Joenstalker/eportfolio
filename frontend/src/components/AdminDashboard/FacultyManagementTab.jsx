import React from 'react';
import './FacultyManagementTab.css';

const FacultyManagementTab = ({
  loading,
  facultyData,
  searchTerm,
  setSearchTerm,
  onAddFacultyClick,
  onEditClick,
  onArchiveClick
}) => {
  // Filter only active faculty data
  const activeFacultyData = facultyData.filter((f) => f.isActive === true);

  // Apply search term filter to active faculty only
  const searchedFacultyData = activeFacultyData.filter((f) => {
    if (!searchTerm) return true;
    
    const fullName = `${f.firstName || ''} ${f.lastName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           f.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Categorize active faculty by department
  const categorizedFaculty = searchedFacultyData.reduce((categories, faculty) => {
    const dept = faculty.department || 'Unassigned';
    
    if (!categories[dept]) {
      categories[dept] = [];
    }
    
    categories[dept].push(faculty);
    
    return categories;
  }, {});

  const hasFacultyMembers = Object.keys(categorizedFaculty).length > 0;

  return (
    <div className="faculty-management">
      <div className="section-header">
        <h3>Active Faculty Members</h3>
        <div className="header-actions">
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
            Object.entries(categorizedFaculty).map(([department, facultyList]) => (
              <div key={department} className="faculty-category">
                <div className="faculty-category-header">
                  <h4>{department}</h4>
                  <div className="category-stats">
                    <span className="count-badge">
                      {facultyList.length} active faculty
                    </span>
                  </div>
                </div>

                {/* Active Faculty Table */}
                <div className="faculty-subsection">
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
                      {facultyList.map((faculty) => {
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
                                  className="archive-btn"
                                  onClick={() => onArchiveClick(faculty)}
                                >
                                  Archive
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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