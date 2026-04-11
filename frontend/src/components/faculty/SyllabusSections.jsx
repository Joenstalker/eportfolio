import React, { useState } from 'react';
import Swal from 'sweetalert2';
import AddSectionModal from './AddSectionModal';

const API_ORIGIN = 'http://localhost:5000';

const normalizeArray = (payload, fallbackKey) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[fallbackKey])) return payload[fallbackKey];
  return [];
};

const toFileUrl = (file) => {
  const rawPath = file?.webViewLink || file?.fileUrl || file?.path || '';
  if (!rawPath) return '';
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (rawPath.startsWith('/')) return `${API_ORIGIN}${rawPath}`;
  return `${API_ORIGIN}/${rawPath}`;
};

const fileLooksLikePreviewable = (file) => {
  const type = String(file?.mimeType || '').toLowerCase();
  return type.startsWith('image/') || type.includes('pdf');
};

const blankDraft = () => ({ title: '', notes: '' });

function SyllabusSections({ courses = [], facultyId, ensureToken }) {
  const [expandedCourseId, setExpandedCourseId] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState('');
  const [sectionsByCourse, setSectionsByCourse] = useState({});
  const [sectionPortfolios, setSectionPortfolios] = useState({});
  const [slotDrafts, setSlotDrafts] = useState({});
  const [fileSelections, setFileSelections] = useState({});
  const [sectionsLoadingFor, setSectionsLoadingFor] = useState('');
  const [portfolioLoadingFor, setPortfolioLoadingFor] = useState('');
  const [sectionsErrorByCourse, setSectionsErrorByCourse] = useState({});
  const [portfolioErrorBySection, setPortfolioErrorBySection] = useState({});
  const [activeAddSectionCourse, setActiveAddSectionCourse] = useState(null);

  const getAuthHeaders = () => {
    const token = ensureToken?.() || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const setDraftForSlot = (sectionId, slotNumber, nextDraft) => {
    setSlotDrafts((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [slotNumber]: {
          ...blankDraft(),
          ...((prev[sectionId] || {})[slotNumber] || {}),
          ...nextDraft
        }
      }
    }));
  };

  const getDraftForSlot = (sectionId, slot) =>
    (slotDrafts[sectionId] && slotDrafts[sectionId][slot.slotNumber]) || {
      title: slot.title || '',
      notes: slot.notes || ''
    };

  const setSelectionForSlot = (sectionId, slotNumber, evidenceType, files) => {
    setFileSelections((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [slotNumber]: {
          ...((prev[sectionId] || {})[slotNumber] || {}),
          [evidenceType]: files
        }
      }
    }));
  };

  const getSelectionForSlot = (sectionId, slotNumber, evidenceType) =>
    (((fileSelections[sectionId] || {})[slotNumber] || {})[evidenceType]) || [];

  const loadSections = async (courseId) => {
    setSectionsLoadingFor(courseId);
    setSectionsErrorByCourse((prev) => ({ ...prev, [courseId]: '' }));

    try {
      const res = await fetch(`/api/sections/${courseId}`, { headers: getAuthHeaders() });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to load sections');
      }
      const sections = normalizeArray(payload, 'sections');
      setSectionsByCourse((prev) => ({ ...prev, [courseId]: sections }));
    } catch (error) {
      setSectionsByCourse((prev) => ({ ...prev, [courseId]: [] }));
      setSectionsErrorByCourse((prev) => ({ ...prev, [courseId]: error.message || 'Failed to load sections' }));
    } finally {
      setSectionsLoadingFor('');
    }
  };

  const loadPortfolio = async (sectionId) => {
    setPortfolioLoadingFor(sectionId);
    setPortfolioErrorBySection((prev) => ({ ...prev, [sectionId]: '' }));
    try {
      const res = await fetch(`/api/section-portfolios/section/${sectionId}`, {
        headers: getAuthHeaders()
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to load activity slots');
      }
      const portfolio = payload?.portfolio || null;
      setSectionPortfolios((prev) => ({ ...prev, [sectionId]: portfolio }));

      const nextDrafts = {};
      (portfolio?.slots || []).forEach((slot) => {
        nextDrafts[slot.slotNumber] = {
          title: slot.title || '',
          notes: slot.notes || ''
        };
      });
      setSlotDrafts((prev) => ({
        ...prev,
        [sectionId]: nextDrafts
      }));
    } catch (error) {
      setPortfolioErrorBySection((prev) => ({ ...prev, [sectionId]: error.message || 'Failed to load activity slots' }));
    } finally {
      setPortfolioLoadingFor('');
    }
  };

  const handleToggleCourse = async (courseId) => {
    const willExpand = expandedCourseId !== courseId;
    setExpandedCourseId(willExpand ? courseId : '');
    setExpandedSectionId('');
    if (willExpand) {
      await loadSections(courseId);
    }
  };

  const handleToggleSection = async (sectionId) => {
    const willExpand = expandedSectionId !== sectionId;
    setExpandedSectionId(willExpand ? sectionId : '');
    if (willExpand) {
      await loadPortfolio(sectionId);
    }
  };

  const saveSlotMeta = async (sectionId, slotNumber) => {
    const draft = getDraftForSlot(sectionId, { slotNumber });
    try {
      const res = await fetch(`/api/section-portfolios/section/${sectionId}/slot/${slotNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title: draft.title,
          notes: draft.notes
        })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || 'Failed to save slot details');
      }
      await loadPortfolio(sectionId);
      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: `Course Outcome ${slotNumber} details updated.`,
        timer: 1400,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error.message || 'Failed to save slot details',
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  const uploadEvidence = async (sectionId, slotNumber, evidenceType) => {
    const selectedFiles = getSelectionForSlot(sectionId, slotNumber, evidenceType);
    if (!selectedFiles.length) {
      Swal.fire({
        icon: 'warning',
        title: 'No Files Selected',
        text: 'Please choose file(s) before uploading.',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    const formData = new FormData();
    formData.append('evidenceType', evidenceType);
    selectedFiles.forEach((file) => formData.append('files', file));

    try {
      const res = await fetch(`/api/section-portfolios/section/${sectionId}/slot/${slotNumber}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || 'Upload failed');
      }

      setSelectionForSlot(sectionId, slotNumber, evidenceType, []);
      await loadPortfolio(sectionId);

      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: 'Evidence uploaded successfully.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Upload failed',
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  const renderFileList = (files) => {
    if (!files || files.length === 0) {
      return <div className="empty-state" style={{ padding: '0.4rem 0' }}>No files uploaded yet.</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.45rem' }}>
        {files.map((file) => (
          <a
            key={file._id || file.fileName || file.fileUrl}
            href={toFileUrl(file)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.9rem' }}
          >
            {file.fileName || file.originalName || 'Uploaded file'}
            {fileLooksLikePreviewable(file) ? ' (preview)' : ' (open)'}
          </a>
        ))}
      </div>
    );
  };

  if (!courses.length) {
    return (
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <h3>Course Sections and Activities</h3>
        <p className="empty-state">No assigned courses available for syllabus organization.</p>
      </div>
    );
  }

  return (
    <div className="content-card" style={{ marginTop: '1.5rem' }}>
      <h3>Course Sections and Activities</h3>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Select a section to fill the standard Course Outcome 1 to 4 activity slots.
      </p>

      {courses.map((course) => {
        const isCourseOpen = expandedCourseId === course._id;
        const sections = sectionsByCourse[course._id] || [];
        const courseError = sectionsErrorByCourse[course._id];
        const isLoadingSections = sectionsLoadingFor === course._id;

        return (
          <div key={course._id} className="item-card" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => handleToggleCourse(course._id)}
              style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}
            >
              <span><strong>{course.courseCode}</strong> - {course.courseName}</span>
              <span>{isCourseOpen ? '[-]' : '[+]'}</span>
            </button>

            {isCourseOpen && (
              <div style={{ marginTop: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <button className="add-button" type="button" onClick={() => setActiveAddSectionCourse(course)}>
                    Add Section
                  </button>
                </div>

                {courseError && <div className="empty-state">{courseError}</div>}
                {isLoadingSections && <div className="empty-state">Loading sections...</div>}
                {!isLoadingSections && !courseError && sections.length === 0 && (
                  <div className="empty-state">No sections yet.</div>
                )}

                {sections.map((section) => {
                  const isSectionOpen = expandedSectionId === section._id;
                  const sectionPortfolio = sectionPortfolios[section._id];
                  const slots = (sectionPortfolio?.slots || []).slice().sort((a, b) => a.slotNumber - b.slotNumber);
                  const sectionError = portfolioErrorBySection[section._id];
                  const isLoadingPortfolio = portfolioLoadingFor === section._id;

                  return (
                    <div key={section._id} style={{ border: '1px solid #e9ecef', borderRadius: '10px', padding: '0.8rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSection(section._id)}
                        style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <span><strong>{section.name}</strong> <span style={{ color: '#6c757d' }}>({section.semester})</span></span>
                        <span>{isSectionOpen ? '[-]' : '[+]'}</span>
                      </button>

                      {isSectionOpen && (
                        <div style={{ marginTop: '0.8rem' }}>
                          <div style={{ marginBottom: '0.65rem', fontSize: '0.9rem', color: '#555' }}>
                            Completion: {sectionPortfolio?.completionSummary?.completedSlots || 0}/4 slots complete
                          </div>
                          {sectionError && <div className="empty-state">{sectionError}</div>}
                          {isLoadingPortfolio && <div className="empty-state">Loading structured activity slots...</div>}

                          {!isLoadingPortfolio && slots.map((slot) => {
                            const draft = getDraftForSlot(section._id, slot);
                            const selectedInstructions = getSelectionForSlot(section._id, slot.slotNumber, 'instructions');
                            const selectedOutputs = getSelectionForSlot(section._id, slot.slotNumber, 'studentOutputs');
                            const selectedRubrics = getSelectionForSlot(section._id, slot.slotNumber, 'ratedRubrics');
                            const existingInstructions = slot.instructions ? [slot.instructions] : [];
                            const noEvidenceYet =
                              existingInstructions.length === 0 &&
                              (slot.studentOutputs || []).length === 0 &&
                              (slot.ratedRubrics || []).length === 0;

                            return (
                              <div key={`slot-${slot.slotNumber}`} style={{ border: '1px solid #f0f0f0', borderRadius: '10px', padding: '0.9rem', marginBottom: '0.7rem', background: '#fbfcfd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                  <strong>Course Outcome {slot.courseOutcomeNumber} / Activity {slot.activityNumber}</strong>
                                  <span className="section-badge">{slot.status.replace('_', ' ')}</span>
                                </div>
                                {noEvidenceYet && (
                                  <div className="empty-state" style={{ marginBottom: '0.6rem' }}>
                                    No activities yet
                                  </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                  <label>Slot Title</label>
                                  <input
                                    type="text"
                                    value={draft.title}
                                    onChange={(e) => setDraftForSlot(section._id, slot.slotNumber, { title: e.target.value })}
                                    placeholder={`Course Outcome ${slot.slotNumber} / Activity ${slot.slotNumber}`}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.55rem' }}>
                                  <label>Notes</label>
                                  <textarea
                                    rows="2"
                                    value={draft.notes}
                                    onChange={(e) => setDraftForSlot(section._id, slot.slotNumber, { notes: e.target.value })}
                                    placeholder="Add notes or context for this activity slot"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="save-button"
                                  style={{ marginTop: 0, marginBottom: '0.7rem', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                                  onClick={() => saveSlotMeta(section._id, slot.slotNumber)}
                                >
                                  Save Slot Details
                                </button>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                                  <div style={{ borderTop: '1px dashed #d9e2ec', paddingTop: '0.6rem' }}>
                                    <strong>1. Instructions</strong>
                                    <input type="file" onChange={(e) => setSelectionForSlot(section._id, slot.slotNumber, 'instructions', e.target.files?.[0] ? [e.target.files[0]] : [])} />
                                    {selectedInstructions.length > 0 && <div style={{ fontSize: '0.85rem' }}>Selected: {selectedInstructions[0].name}</div>}
                                    <button type="button" className="add-button" style={{ marginTop: '0.4rem' }} onClick={() => uploadEvidence(section._id, slot.slotNumber, 'instructions')}>
                                      Upload Instructions
                                    </button>
                                    {renderFileList(existingInstructions)}
                                  </div>

                                  <div style={{ borderTop: '1px dashed #d9e2ec', paddingTop: '0.6rem' }}>
                                    <strong>2. Student Outputs</strong>
                                    <input type="file" multiple onChange={(e) => setSelectionForSlot(section._id, slot.slotNumber, 'studentOutputs', Array.from(e.target.files || []))} />
                                    {selectedOutputs.length > 0 && <div style={{ fontSize: '0.85rem' }}>Selected: {selectedOutputs.length} file(s)</div>}
                                    <button type="button" className="add-button" style={{ marginTop: '0.4rem' }} onClick={() => uploadEvidence(section._id, slot.slotNumber, 'studentOutputs')}>
                                      Upload Student Outputs
                                    </button>
                                    {renderFileList(slot.studentOutputs || [])}
                                  </div>

                                  <div style={{ borderTop: '1px dashed #d9e2ec', paddingTop: '0.6rem' }}>
                                    <strong>3. Rated Rubrics</strong>
                                    <input type="file" multiple onChange={(e) => setSelectionForSlot(section._id, slot.slotNumber, 'ratedRubrics', Array.from(e.target.files || []))} />
                                    {selectedRubrics.length > 0 && <div style={{ fontSize: '0.85rem' }}>Selected: {selectedRubrics.length} file(s)</div>}
                                    <button type="button" className="add-button" style={{ marginTop: '0.4rem' }} onClick={() => uploadEvidence(section._id, slot.slotNumber, 'ratedRubrics')}>
                                      Upload Rated Rubrics
                                    </button>
                                    {renderFileList(slot.ratedRubrics || [])}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {activeAddSectionCourse && (
        <AddSectionModal
          courseId={activeAddSectionCourse._id}
          facultyId={facultyId}
          defaultSemester={activeAddSectionCourse.semester || ''}
          onClose={() => setActiveAddSectionCourse(null)}
          onSaved={() => loadSections(activeAddSectionCourse._id)}
        />
      )}
    </div>
  );
}

export default SyllabusSections;
