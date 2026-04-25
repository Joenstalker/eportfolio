import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import './EvidenceReviewTab.css';

const API_ORIGIN = 'http://localhost:5000';

const toPreviewUrl = (file) => {
  const raw = file?.webViewLink || file?.fileUrl || '';
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${API_ORIGIN}${raw}`;
  return `${API_ORIGIN}/${raw}`;
};

const isImage = (file) => String(file?.mimeType || '').toLowerCase().startsWith('image/');
const isPdf = (file) => String(file?.mimeType || '').toLowerCase().includes('pdf');

const EvidenceReviewTab = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/section-portfolios/admin/portfolios', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch evidence portfolios');
      }
      setPortfolios(Array.isArray(payload?.portfolios) ? payload.portfolios : []);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to fetch evidence portfolios',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const filteredPortfolios = useMemo(() => {
    const searchKey = search.trim().toLowerCase();
    if (!searchKey) return portfolios;
    return portfolios.filter((portfolio) => {
      const facultyName = `${portfolio.facultyId?.firstName || ''} ${portfolio.facultyId?.lastName || ''}`.toLowerCase();
      const courseLabel = `${portfolio.courseId?.courseCode || ''} ${portfolio.courseId?.courseName || ''}`.toLowerCase();
      const sectionName = String(portfolio.sectionId?.name || '').toLowerCase();
      return facultyName.includes(searchKey) || courseLabel.includes(searchKey) || sectionName.includes(searchKey);
    });
  }, [portfolios, search]);

  const renderFileButtons = (files = []) => {
    if (!files.length) {
      return <div className="evidence-empty">No files</div>;
    }
    return (
      <div className="evidence-file-list">
        {files.map((file) => (
          <button
            key={file._id || file.fileName || file.fileUrl}
            className="evidence-file-btn"
            type="button"
            onClick={() => setSelectedFile(file)}
          >
            {file.fileName || file.originalName || 'File'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="evidence-review-tab">
      <div className="evidence-review-header">
        <h2>Evidence Review</h2>
        <button type="button" className="btn-refresh" onClick={fetchPortfolios}>Refresh</button>
      </div>

      <div className="evidence-search">
        <input
          type="text"
          placeholder="Search by faculty, subject, or section"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="evidence-empty">Loading evidence portfolios...</div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="evidence-empty">No section portfolios available.</div>
      ) : (
        <div className="evidence-table-wrap">
          <table className="evidence-table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Subject</th>
                <th>Section</th>
                <th>Completion</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.map((portfolio) => (
                <tr key={portfolio._id}>
                  <td>{portfolio.facultyId?.firstName} {portfolio.facultyId?.lastName}</td>
                  <td>{portfolio.courseId?.courseCode} - {portfolio.courseId?.courseName}</td>
                  <td>{portfolio.sectionId?.name}</td>
                  <td>{portfolio.completionSummary?.completedSlots || 0}/4</td>
                  <td>
                    <button
                      type="button"
                      className="btn-preview"
                      onClick={() => {
                        setSelectedPortfolio(portfolio);
                        setSelectedFile(null);
                      }}
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPortfolio && (
        <div className="evidence-modal-backdrop" onClick={() => setSelectedPortfolio(null)}>
          <div className="evidence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="evidence-modal-header">
              <h3>
                {selectedPortfolio.courseId?.courseCode} - {selectedPortfolio.sectionId?.name}
              </h3>
              <button type="button" onClick={() => setSelectedPortfolio(null)}>x</button>
            </div>
            <div className="evidence-modal-body">
              <div className="evidence-slot-list">
                {(selectedPortfolio.slots || []).map((slot) => (
                  <div key={slot.slotNumber} className="evidence-slot-card">
                    <h4>CO{slot.courseOutcomeNumber} / A{slot.activityNumber}</h4>
                    <p className="slot-status">Status: {slot.status}</p>
                    <div className="slot-group">
                      <strong>Instructions</strong>
                      {renderFileButtons(slot.instructions ? [slot.instructions] : [])}
                    </div>
                    <div className="slot-group">
                      <strong>Student Outputs</strong>
                      {renderFileButtons(slot.studentOutputs || [])}
                    </div>
                    <div className="slot-group">
                      <strong>Rated Rubrics</strong>
                      {renderFileButtons(slot.ratedRubrics || [])}
                    </div>
                  </div>
                ))}
              </div>

              <div className="evidence-preview-pane">
                {!selectedFile ? (
                  <div className="evidence-empty">Select a file to preview.</div>
                ) : (
                  <>
                    <div className="preview-meta">
                      <strong>{selectedFile.fileName || selectedFile.originalName}</strong>
                      <a href={toPreviewUrl(selectedFile)} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                    </div>
                    {isImage(selectedFile) ? (
                      <img src={toPreviewUrl(selectedFile)} alt={selectedFile.fileName || 'Evidence preview'} className="evidence-preview-image" />
                    ) : isPdf(selectedFile) ? (
                      <iframe title="PDF Preview" src={toPreviewUrl(selectedFile)} className="evidence-preview-frame" />
                    ) : (
                      <div className="evidence-empty">Preview unavailable for this file type.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceReviewTab;
