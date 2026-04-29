import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  FaCheckCircle, FaTimesCircle, FaEye, FaFile, FaSearch,
  FaFilter, FaUser, FaCalendar, FaExclamationTriangle, FaDownload
} from 'react-icons/fa';
import './PortfolioReviewTab.css';

const REQUIRED_FACULTY_DOCS = [
  { id: 'A.1.0', name: 'Faculty Profile' },
  { id: 'B.1.0', name: 'Educational Attainment' },
  { id: 'C.1.0', name: 'Service Records' },
  { id: 'D.1.0', name: 'Seminars & Workshops' },
  { id: 'E.1.0', name: 'Grants & Awards' },
  { id: 'F.1.0', name: 'Research Proposals' },
  { id: 'G.1.0', name: 'Extension Involvement' },
  { id: 'H.1.0', name: 'Production' },
  { id: 'I.1.0', name: 'Membership' },
  { id: 'J.1.0', name: 'Licensure Examinations' },
  { id: 'L.1.0', name: 'IPCR' },
];

const REQUIRED_CLASS_DOCS = [
  { id: 'A.1.0', name: 'Instructional Load Report' },
  { id: 'B.1.0', name: 'Official Class List' },
  { id: 'C.1.0', name: 'Syllabus' },
  { id: 'D.1.0', name: 'Instructional Materials' },
  { id: 'E.1.0', name: 'Classroom Policies' },
  { id: 'F.1.0', name: 'Syllabus Acknowledgement' },
  { id: 'G.1.0', name: 'Seat Plan' },
  { id: 'H.1.0', name: 'Classroom Officers' },
  { id: 'I.1.0', name: 'Attendance Records' },
  { id: 'J.1.0', name: 'Preliminary Test' },
  { id: 'K.1.0', name: 'Signed TOS' },
  { id: 'L.1.0', name: 'Test Questionnaire' },
  { id: 'M.1.0', name: 'Instruction of Activities' },
  { id: 'N.1.0', name: 'Sample Checked Output' },
  { id: 'O.1.0', name: 'Answer Key' },
  { id: 'P.1.0', name: 'Return Output Receipt' },
];

const getFacultyName = (portfolio) => {
  const f = portfolio.facultyId;
  if (!f) return 'Unknown Faculty';
  if (f.firstName || f.lastName) return `${f.firstName || ''} ${f.lastName || ''}`.trim();
  if (f.name) return f.name;
  return 'Unknown Faculty';
};

const getFacultyDept = (portfolio) => {
  const f = portfolio.facultyId;
  if (!f) return '';
  return f.department || '';
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved': return { class: 'status-approved', icon: <FaCheckCircle />, text: 'Approved' };
    case 'rejected': return { class: 'status-rejected', icon: <FaTimesCircle />, text: 'Rejected' };
    case 'pending': return { class: 'status-pending', icon: <FaExclamationTriangle />, text: 'Pending Review' };
    default: return { class: 'status-not-submitted', icon: null, text: 'Not Submitted' };
  }
};

const PortfolioReviewTab = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/faculty-portfolio/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolios(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch portfolios');
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load faculty portfolios' });
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    let result = [...portfolios];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => {
        const name = getFacultyName(p).toLowerCase();
        const email = (p.facultyId?.email || '').toLowerCase();
        const dept = getFacultyDept(p).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      });
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => (p.adminReviewStatus || 'not_submitted') === statusFilter);
    }
    setFiltered(result);
  }, [portfolios, searchTerm, statusFilter]);

  const openReviewModal = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedPortfolio(null);
  };

  const getMissingDocuments = (portfolio) => {
    const missing = [];
    const subjects = portfolio.subjects || {};
    const subjectKeys = Object.keys(subjects);

    // Check faculty portfolio docs (using default subject or first subject)
    const defaultSubject = subjects.default || subjects[subjectKeys[0]];
    if (defaultSubject && defaultSubject.facultyPortfolio) {
      const fp = defaultSubject.facultyPortfolio;
      REQUIRED_FACULTY_DOCS.forEach(doc => {
        const entry = fp[doc.id];
        if (!entry || !entry.uploaded) {
          missing.push(`Faculty - ${doc.name}`);
        }
      });
    } else {
      REQUIRED_FACULTY_DOCS.forEach(doc => missing.push(`Faculty - ${doc.name}`));
    }

    // Check class portfolio docs
    subjectKeys.forEach(subKey => {
      const sub = subjects[subKey];
      if (sub && sub.classPortfolio) {
        const cp = sub.classPortfolio;
        REQUIRED_CLASS_DOCS.forEach(doc => {
          const entry = cp[doc.id];
          if (!entry || !entry.uploaded) {
            missing.push(`Class [${subKey}] - ${doc.name}`);
          }
        });
      }
    });

    return missing;
  };

  const handleApprove = async () => {
    if (!selectedPortfolio) return;
    const result = await Swal.fire({
      icon: 'question',
      title: 'Approve Portfolio?',
      text: `Approve portfolio for ${getFacultyName(selectedPortfolio)}?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#22c55e'
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const facultyId = typeof selectedPortfolio.facultyId === 'object' ? selectedPortfolio.facultyId._id : selectedPortfolio.facultyId;
      const res = await fetch(`/api/faculty-portfolio/admin/${facultyId}/review`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved', message: 'Portfolio approved. All required documents are complete.', missingDocuments: [] })
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Approved', text: 'Portfolio approved successfully.', timer: 2000, showConfirmButton: false });
        closeReviewModal();
        fetchPortfolios();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const handleReject = async () => {
    if (!selectedPortfolio) return;
    const missing = getMissingDocuments(selectedPortfolio);

    const { value: formValues } = await Swal.fire({
      title: 'Reject Portfolio & Send Warning',
      html:
        `<div style="text-align:left;margin-bottom:12px;">
          <p style="font-size:0.9rem;color:#666;">The following documents appear to be missing:</p>
          <ul style="max-height:180px;overflow-y:auto;text-align:left;font-size:0.85rem;color:#333;margin:8px 0;padding-left:20px;">
            ${missing.length > 0 ? missing.map(m => `<li>${m}</li>`).join('') : '<li>No missing documents detected</li>'}
          </ul>
        </div>
        <textarea id="swal-reason" class="swal2-textarea" placeholder="Enter warning message for faculty..." style="width:100%;min-height:80px;">${missing.length > 0 ? 'Please upload the following missing documents before resubmitting:\n' + missing.map(m => '- ' + m).join('\n') : ''}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Send Warning',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      preConfirm: () => {
        const reason = document.getElementById('swal-reason').value;
        if (!reason || !reason.trim()) {
          Swal.showValidationMessage('Please enter a warning message');
          return false;
        }
        return { reason, missingDocuments: missing };
      }
    });

    if (!formValues) return;

    try {
      const token = localStorage.getItem('token');
      const facultyId = typeof selectedPortfolio.facultyId === 'object' ? selectedPortfolio.facultyId._id : selectedPortfolio.facultyId;
      const res = await fetch(`/api/faculty-portfolio/admin/${facultyId}/review`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected', message: formValues.reason, missingDocuments: formValues.missingDocuments })
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Warning Sent', text: 'Portfolio rejected and warning message sent to faculty.', timer: 2000, showConfirmButton: false });
        closeReviewModal();
        fetchPortfolios();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const getUploadedFiles = (portfolio) => {
    const files = [];
    const subjects = portfolio.subjects || {};
    Object.keys(subjects).forEach(subKey => {
      const sub = subjects[subKey];
      if (sub.facultyPortfolio) {
        Object.entries(sub.facultyPortfolio).forEach(([key, val]) => {
          if (val && val.uploaded && val.fileName) {
            files.push({ section: `Faculty [${subKey}]`, code: key, name: val.fileName, url: val.fileUrl });
          }
        });
      }
      if (sub.classPortfolio) {
        Object.entries(sub.classPortfolio).forEach(([key, val]) => {
          if (val && val.uploaded && val.fileName) {
            files.push({ section: `Class [${subKey}]`, code: key, name: val.fileName, url: val.fileUrl });
          }
        });
      }
    });
    return files;
  };

  if (loading) {
    return (
      <div className="portfolio-review-loading">
        <div className="spinner" />
        <p>Loading portfolios...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-review-tab">
      <div className="review-header">
        <h2><FaEye /> Portfolio Review & Approval</h2>
        <p>Review faculty-submitted portfolios, verify uploaded documents, and approve or send warnings for missing files.</p>
      </div>

      {/* Stats */}
      <div className="review-stats">
        <div className="stat-box">
          <span className="stat-number">{portfolios.length}</span>
          <span className="stat-label">Total Portfolios</span>
        </div>
        <div className="stat-box pending">
          <span className="stat-number">{portfolios.filter(p => p.adminReviewStatus === 'pending').length}</span>
          <span className="stat-label">Pending Review</span>
        </div>
        <div className="stat-box approved">
          <span className="stat-number">{portfolios.filter(p => p.adminReviewStatus === 'approved').length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-box rejected">
          <span className="stat-number">{portfolios.filter(p => p.adminReviewStatus === 'rejected').length}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Filters */}
      <div className="review-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search faculty by name, email, or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="review-table-wrapper">
        <table className="review-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Department</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Documents</th>
              <th>Last Review</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  <div className="empty-state">
                    <p>No portfolios match your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const badge = getStatusBadge(p.adminReviewStatus || 'not_submitted');
                const files = getUploadedFiles(p);
                const missing = getMissingDocuments(p);
                return (
                  <tr key={p._id}>
                    <td>
                      <div className="faculty-cell">
                        <div className="faculty-avatar"><FaUser /></div>
                        <div>
                          <div className="faculty-name">{getFacultyName(p)}</div>
                          <div className="faculty-email">{p.facultyId?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getFacultyDept(p) || '-'}</td>
                    <td>
                      {p.submittedForReview ? (
                        <span className="submitted-yes"><FaCalendar /> {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : 'Yes'}</span>
                      ) : (
                        <span className="submitted-no">Not yet</span>
                      )}
                    </td>
                    <td><span className={`status-pill ${badge.class}`}>{badge.icon} {badge.text}</span></td>
                    <td>
                      <span className="doc-count">{files.length} uploaded</span>
                      {missing.length > 0 && (
                        <span className="missing-count">{missing.length} missing</span>
                      )}
                    </td>
                    <td>
                      {p.adminReviewDate ? new Date(p.adminReviewDate).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <button className="action-btn review" onClick={() => openReviewModal(p)}>
                        <FaEye /> Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedPortfolio && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Portfolio: {getFacultyName(selectedPortfolio)}</h3>
              <button className="close-btn" onClick={closeReviewModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Faculty Info */}
              <div className="info-bar">
                <span><FaUser /> {getFacultyName(selectedPortfolio)}</span>
                <span>{selectedPortfolio.facultyId?.email || ''}</span>
                <span>{getFacultyDept(selectedPortfolio) || 'No department'}</span>
              </div>

              {/* Status Banner */}
              {selectedPortfolio.adminReviewStatus === 'approved' && (
                <div className="banner approved">This portfolio has been approved.</div>
              )}
              {selectedPortfolio.adminReviewStatus === 'rejected' && (
                <div className="banner rejected">
                  <strong>Rejected:</strong> {selectedPortfolio.adminReviewMessage || 'No message provided.'}
                </div>
              )}
              {selectedPortfolio.adminReviewStatus === 'pending' && (
                <div className="banner pending">This portfolio is awaiting your review.</div>
              )}
              {(selectedPortfolio.adminReviewStatus || 'not_submitted') === 'not_submitted' && (
                <div className="banner not-submitted">This portfolio has not been submitted for review yet.</div>
              )}

              {/* Uploaded Documents */}
              <h4 className="section-title">Uploaded Documents</h4>
              {(() => {
                const files = getUploadedFiles(selectedPortfolio);
                if (files.length === 0) return <p className="empty-docs">No documents uploaded yet.</p>;
                return (
                  <div className="docs-list">
                    {files.map((f, i) => (
                      <div key={i} className="doc-item">
                        <div className="doc-icon"><FaFile /></div>
                        <div className="doc-info">
                          <div className="doc-name">{f.name}</div>
                          <div className="doc-meta">{f.section} &bull; {f.code}</div>
                        </div>
                        {f.url && (
                          <a className="doc-link" href={f.url} target="_blank" rel="noopener noreferrer">
                            <FaDownload /> View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Missing Documents */}
              {(() => {
                const missing = getMissingDocuments(selectedPortfolio);
                if (missing.length === 0) return null;
                return (
                  <>
                    <h4 className="section-title missing-title"><FaExclamationTriangle /> Missing / Required Documents</h4>
                    <div className="missing-list">
                      {missing.map((m, i) => (
                        <div key={i} className="missing-item">
                          <FaTimesCircle className="missing-icon" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeReviewModal}>Close</button>
              {selectedPortfolio.submittedForReview && selectedPortfolio.adminReviewStatus !== 'approved' && (
                <button className="btn-success" onClick={handleApprove}>
                  <FaCheckCircle /> Approve Portfolio
                </button>
              )}
              {selectedPortfolio.submittedForReview && selectedPortfolio.adminReviewStatus !== 'rejected' && (
                <button className="btn-danger" onClick={handleReject}>
                  <FaTimesCircle /> Reject & Send Warning
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioReviewTab;
