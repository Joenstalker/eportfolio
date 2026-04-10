import React from 'react';
import './ArchivedUsersTab.css';

const ArchivedUsersTab = ({ archivedFaculty = [], onUnarchiveClick, onDeleteClick }) => {
  return (
    <div className="faculty-management">
      <div className="section-header">
        <h3>Archived Users</h3>
      </div>

      <div className="faculty-table-container">
        {archivedFaculty.length === 0 ? (
          <div className="empty-state">No archived users.</div>
        ) : (
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Archived Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedFaculty.map((faculty) => {
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
                const fullName = getFacultyFullName(faculty);
                let archivedDate = 'N/A';
                try {
                  archivedDate = faculty?.archivedAt ? new Date(faculty.archivedAt).toLocaleDateString() : 'N/A';
                } catch (error) {
                  console.error('Error formatting date:', error);
                }
                return (
                  <tr key={faculty?._id || Math.random()} className="inactive">
                    <td>{fullName}</td>
                    <td>{faculty?.email}</td>
                    <td>{faculty?.role}</td>
                    <td>{archivedDate}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="status-btn"
                          disabled={isAdmin}
                          title={isAdmin ? 'Admin account status cannot be changed' : 'Unarchive user'}
                          onClick={() => onUnarchiveClick && onUnarchiveClick(faculty)}
                        >
                          Unarchive
                        </button>
                        {faculty?.role !== 'admin' && onDeleteClick && (
                          <button
                            className="delete-btn"
                            onClick={() => onDeleteClick(faculty)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ArchivedUsersTab;

