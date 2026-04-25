import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
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

  // Only one department expanded at a time
  const [expandedDept, setExpandedDept] = useState(null);
  const toggleDepartment = (dept) => {
    setExpandedDept((prev) => (prev === dept ? null : dept));
  };

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
            Object.entries(categorizedFaculty).map(([department, facultyList]) => {
              const isExpanded = expandedDept === department;
              return (
                <div key={department} className={`faculty-card${isExpanded ? ' expanded' : ''}`}>
                  <button className={`faculty-card-header${isExpanded ? ' active' : ''}`} onClick={() => toggleDepartment(department)}>
                    <span className="faculty-card-title">{department}</span>
                    <span className="faculty-card-badge">{facultyList.length} active faculty</span>
                    <span className="faculty-card-chevron">{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                  </button>
                  <div className={`faculty-card-body${isExpanded ? ' expanded' : ''}`} style={{ maxHeight: isExpanded ? 600 : 0, transition: 'max-height 0.4s cubic-bezier(.4,2,.6,1)', overflow: 'hidden' }}>
                    {isExpanded && (
                      facultyList.length > 0 ? (
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
                              const getFacultyFullName = (faculty) => {
                                if (!faculty) return '';
                                const rawName = faculty.name && String(faculty.name).trim()
                                  ? String(faculty.name).trim()
                                  : `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
                                const normalizedName = rawName.replace(/\s+/g, ' ').trim();
                                if (!normalizedName) return '';
                                const roleLikeSuffixes = new Set(['user', 'admin', 'faculty', 'staff', 'hod']);
                                const nameParts = normalizedName.split(' ');
                                const lastPart = nameParts[nameParts.length - 1]?.toLowerCase();
                                if (nameParts.length > 1 && roleLikeSuffixes.has(lastPart)) {
                                  return nameParts.slice(0, -1).join(' ');
                                }
                                return normalizedName;
                              };
                              return (
                                <tr key={faculty._id}>
                                  <td>{getFacultyFullName(faculty)}</td>
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
                      ) : (
                        <div className="empty-state">No faculty available</div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">No faculty members found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyManagementTab;