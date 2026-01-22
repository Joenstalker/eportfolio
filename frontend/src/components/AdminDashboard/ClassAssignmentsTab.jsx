import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './ClassAssignmentsTab.css';

const ClassAssignmentsTab = ({
  handleUploadSchedule,
  selectedFile,
  setSelectedFile,
  uploadProgress,
  uploadsList
}) => {
  const [uploadStep, setUploadStep] = useState(0);
  const [validationResult, setValidationResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { number: 1, label: 'Upload Schedule', icon: '📤' },
    { number: 2, label: 'Validate Assignments', icon: '✓' },
    { number: 3, label: 'Confirm & Publish', icon: '🚀' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - Restrict to CSV/Excel only, block PDFs and DOCX
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload only CSV or Excel files (.csv, .xlsx, .xls). PDFs and Word documents are not accepted.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    setSelectedFile(file);
    setUploadStep(1);
    setValidationResult(null);
  };

  const handleValidation = () => {
    // Simulate validation - Check for instructor conflicts, room overlaps, missing subjects
    setUploadStep(2);
    
    setTimeout(() => {
      // Mock validation results
      const mockValidation = {
        valid: 45,
        conflicts: 3,
        warnings: [
          'Instructor John Doe has overlapping schedule on MWF 10:00-11:00',
          'Room 301 is double-booked on Tuesday 2:00-3:00',
          'CS-101 Section B is missing instructor assignment'
        ],
        status: 'warning' // 'success', 'warning', or 'error'
      };
      setValidationResult(mockValidation);
    }, 1500);
  };

  const handlePreview = () => {
    setShowPreview(true);
    Swal.fire({
      title: 'Preview Assignments',
      html: `
        <div style="text-align: left;">
          <p><strong>Academic Term:</strong> 2nd Semester AY 2025-2026</p>
          <p><strong>Total Assignments:</strong> 48</p>
          <p><strong>Instructors:</strong> 25</p>
          <p><strong>Rooms:</strong> 15</p>
          <hr>
          <p style="font-size: 0.9em; color: #666;">Preview functionality will show detailed assignment list</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#111827'
    });
  };

  const handlePublish = async () => {
    const result = await Swal.fire({
      title: 'Confirm Publishing',
      html: `
        <div style="text-align: left;">
          <p><strong>⚠️ This will update class assignments for:</strong></p>
          <ul style="margin-top: 10px;">
            <li>All students</li>
            <li>All faculty members</li>
            <li>Room schedules</li>
          </ul>
          <p style="margin-top: 15px; color: #d97706;">Published assignments will be locked unless manually unlocked by admin.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#111827',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Publish',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      handleUploadSchedule();
      setUploadStep(0);
      setValidationResult(null);
      setSelectedFile(null);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Class assignments updated successfully',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const handleDownloadTemplate = () => {
    Swal.fire({
      icon: 'info',
      title: 'Download Template',
      text: 'Template download functionality will be implemented here.',
      confirmButtonColor: '#111827'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'published': return 'status-published';
      case 'validated': return 'status-validated';
      case 'draft': return 'status-draft';
      default: return 'status-draft';
    }
  };

  return (
    <div className="class-assignments">
      <div className="section-header">
        <h3>Class Assignment Management</h3>
        <span className="count-badge">Upload & manage class schedules</span>
      </div>

      {/* Step Indicator: Upload schedule → Validate assignments → Confirm & publish */}
      <div className="step-indicator">
        {steps.map((step, idx) => (
          <div 
            key={step.number} 
            className={`step ${uploadStep >= idx + 1 ? 'active' : ''} ${uploadStep === idx + 1 ? 'current' : ''}`}
          >
            <div className="step-circle">
              {uploadStep > idx + 1 ? '✓' : step.icon}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="assignments-container">
        <div className="upload-section">
          <div className="upload-box">
            <div className="upload-icon">📊</div>
            <h4>Upload Class Assignment File</h4>
            <p className="upload-description">Upload class schedules in CSV or Excel format</p>
            <p className="helper-text">
              📌 Uploaded schedules will automatically assign instructors, rooms, and sections.
            </p>
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
              id="schedule-upload"
            />
            <label htmlFor="schedule-upload" className="file-label">
              Choose File
            </label>
            
            <button 
              className="btn-template"
              onClick={handleDownloadTemplate}
            >
              📥 Download Template
            </button>

            {selectedFile && (
              <div className="file-selected">
                <span>✅ {selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}

            {/* Validation Results: Show valid assignments and conflicts */}
            {validationResult && (
              <div className={`validation-results ${validationResult.status}`}>
                <h5>Validation Results</h5>
                <div className="validation-summary">
                  <div className="validation-item success">
                    <span className="validation-icon">✅</span>
                    <span>{validationResult.valid} Valid assignments</span>
                  </div>
                  {validationResult.conflicts > 0 && (
                    <div className="validation-item warning">
                      <span className="validation-icon">⚠️</span>
                      <span>{validationResult.conflicts} Conflicts found (click to review)</span>
                    </div>
                  )}
                </div>
                
                {validationResult.warnings.length > 0 && (
                  <div className="validation-warnings">
                    <p className="warnings-title">Issues Found:</p>
                    <ul>
                      {validationResult.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="upload-actions">
              {uploadStep === 1 && (
                <button
                  className="btn-primary"
                  onClick={handleValidation}
                  disabled={!selectedFile}
                >
                  Validate Assignments
                </button>
              )}
              
              {uploadStep === 2 && validationResult && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={handlePreview}
                  >
                    👁️ Preview Assignments
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handlePublish}
                    disabled={validationResult.conflicts > 0}
                  >
                    🚀 Confirm & Publish
                  </button>
                  {validationResult.conflicts > 0 && (
                    <p className="publish-disabled-note">
                      ⚠️ {validationResult.conflicts} conflicts detected — publishing disabled
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Upload Feedback: Progress and parsing status */}
            {uploadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-status">
                  {uploadProgress < 30 && 'Reading file...'}
                  {uploadProgress >= 30 && uploadProgress < 70 && 'Assigning classes...'}
                  {uploadProgress >= 70 && uploadProgress < 100 && 'Publishing assignments...'}
                  {uploadProgress === 100 && '✓ Complete!'}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Panel: Upload requirements and rules */}
          <div className="instructions-panel">
            <h4>📋 Upload Requirements</h4>
            <ul className="requirements-list">
              <li>✓ File format: CSV or Excel (.csv, .xlsx, .xls)</li>
              <li>✓ Must include: Course Code, Instructor, Room, Schedule</li>
              <li>✗ PDFs and Word documents are not accepted</li>
              <li>✓ Maximum file size: 5 MB</li>
            </ul>
            <div className="info-note">
              <strong>ℹ️ Note:</strong> System will automatically detect conflicts and validate assignments before publishing.
            </div>
          </div>
        </div>

        {/* Uploaded Class Assignments: Show academic term, status, and actions */}
        <div className="schedules-section">
          <h4>Uploaded Class Assignments</h4>
          <div className="schedules-list">
            {uploadsList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No class assignments uploaded yet.</p>
                <p className="empty-hint">Upload your first schedule to get started.</p>
              </div>
            ) : (
              uploadsList.map((u, idx) => (
                <div key={idx} className="schedule-item enhanced">
                  <div className="schedule-info">
                    <div className="schedule-header-row">
                      <h5>{u.fileName || u.title || 'Untitled'}</h5>
                      <span className={`status-badge ${getStatusBadgeClass(u.status || 'draft')}`}>
                        {u.status || 'draft'}
                      </span>
                    </div>
                    <p className="schedule-meta">
                      <span>📅 {u.academicTerm || '2nd Sem AY 2025-2026'}</span>
                      <span>•</span>
                      <span>👤 {u.faculty || 'Admin'}</span>
                      <span>•</span>
                      <span>{u.uploadedAt ? new Date(u.uploadedAt).toLocaleDateString() : 'Today'}</span>
                    </p>
                  </div>
                  <div className="schedule-actions">
                    {u.fileUrl ? (
                      <>
                        <a
                          className="btn-action view"
                          href={`http://localhost:5000${u.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          👁️ View
                        </a>
                        <button className="btn-action revert" title="Revert to previous version">
                          ↶ Revert
                        </button>
                        <button className="btn-action delete" title="Delete draft">
                          🗑️ Delete
                        </button>
                      </>
                    ) : (
                      <button className="btn-action view" disabled>
                        No File
                      </button>
                    )}
                  </div>
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
