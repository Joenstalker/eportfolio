import React from 'react';
import './ClassAssignmentsTab.css';

const ClassAssignmentsTab = ({
  handleUploadSchedule,
  selectedFile,
  setSelectedFile,
  uploadProgress,
  uploadsList
}) => {
  return (
    <div className="class-assignments">
      <div className="section-header">
        <h3>Class Schedule Upload</h3>
        <span className="count-badge">Upload final class schedules</span>
      </div>

      <div className="assignments-container">
        <div className="upload-section">
          <div className="upload-box">
            <div className="upload-icon">📄</div>
            <h4>Upload Class Schedule</h4>
            <p>Upload a final class schedule (CSV or Excel format)</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="file-input"
              id="schedule-upload"
            />
            <label htmlFor="schedule-upload" className="file-label">
              Choose File
            </label>
            {selectedFile && (
              <div className="file-selected">
                <span>✅ {selectedFile.name}</span>
              </div>
            )}
            <button
              className="btn-upload"
              onClick={handleUploadSchedule}
              disabled={!selectedFile || uploadProgress > 0}
            >
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Schedule'}
            </button>
            {uploadProgress > 0 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        <div className="schedules-section">
          <h4>Recent Uploads</h4>
          <div className="schedules-list">
            {uploadsList.length === 0 ? (
              <div className="empty-state">No recent uploads found.</div>
            ) : (
              uploadsList.map((u, idx) => (
                <div key={idx} className="schedule-item">
                  <div className="schedule-info">
                    <h5>{u.fileName || u.title || 'Untitled'}</h5>
                    <p>
                      {u.faculty || 'Unknown'} •{' '}
                      {u.uploadedAt ? new Date(u.uploadedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  {u.fileUrl ? (
                    <a
                      className="btn-action view"
                      href={`http://localhost:5000${u.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      👁️ View
                    </a>
                  ) : (
                    <button className="btn-action view" disabled>
                      No File
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAssignmentsTab;

