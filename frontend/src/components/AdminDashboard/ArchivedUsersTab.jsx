import React from 'react';
import './ArchivedUsersTab.css';

const ArchivedUsersTab = ({ archivedFaculty, onUnarchiveClick }) => {
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedFaculty.map((faculty) => (
                <tr key={faculty._id} className="inactive">
                  <td>{faculty.name}</td>
                  <td>{faculty.email}</td>
                  <td>{faculty.role}</td>
                  <td>
                    <span className="status-badge inactive">inactive</span>
                  </td>
                  <td>
                    <button
                      className="status-btn"
                      onClick={() => onUnarchiveClick(faculty)}
                    >
                      Unarchive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ArchivedUsersTab;

