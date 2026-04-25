import React, { useEffect, useState } from 'react';
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

const toStatusLabel = (status) =>
  String(status || 'not_started')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getDefaultSlotTitle = (slotNumber) => `Course Outcome ${slotNumber} / Activity ${slotNumber}`;

const hasCustomTitle = (slot) => {
  const title = String(slot?.title || '').trim();
  if (!title) return false;
  return title.toLowerCase() !== getDefaultSlotTitle(slot?.slotNumber).toLowerCase();
};

const slotHasActivity = (slot) => {
  const hasNotes = Boolean(String(slot?.notes || '').trim());
  const hasInstructions = Boolean(slot?.instructions);
  const hasOutputs = Array.isArray(slot?.studentOutputs) && slot.studentOutputs.length > 0;
  const hasRubrics = Array.isArray(slot?.ratedRubrics) && slot.ratedRubrics.length > 0;
  return hasCustomTitle(slot) || hasNotes || hasInstructions || hasOutputs || hasRubrics;
};

function SyllabusSections({
  courses = [],
  facultyId,
  ensureToken,
  selectedCourseId: externalSelectedCourseId,
  selectedSectionId: externalSelectedSectionId,
  onSelectCourse,
  onSelectSection
}) {
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
  const [editorOpenBySection, setEditorOpenBySection] = useState({});

  const currentCourseId = externalSelectedCourseId ?? expandedCourseId;
  const currentSectionId = externalSelectedSectionId ?? expandedSectionId;

  useEffect(() => {
    if (currentCourseId) {
      loadSections(currentCourseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCourseId]);

  useEffect(() => {
    if (currentSectionId) {
      loadPortfolio(currentSectionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSectionId]);

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
      const response = await fetch(`/api/sections/${courseId}`, { headers: getAuthHeaders() });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to load sections');

      const sections = normalizeArray(payload, 'sections');
      setSectionsByCourse((prev) => ({ ...prev, [courseId]: sections }));
    } catch (error) {
      setSectionsByCourse((prev) => ({ ...prev, [courseId]: [] }));
      setSectionsErrorByCourse((prev) => ({
        ...prev,
        [courseId]: error.message || 'Failed to load sections'
      }));
    } finally {
      setSectionsLoadingFor('');
    }
  };

  const loadPortfolio = async (sectionId) => {
    setPortfolioLoadingFor(sectionId);
    setPortfolioErrorBySection((prev) => ({ ...prev, [sectionId]: '' }));

    try {
      const response = await fetch(`/api/section-portfolios/section/${sectionId}`, {
        headers: getAuthHeaders()
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to load activity slots');

      const portfolio = payload?.portfolio || {
        slots: Array.from({ length: 4 }).map((_, idx) => ({
          slotNumber: idx + 1,
          courseOutcomeNumber: idx + 1,
          activityNumber: idx + 1,
          title: '',
          notes: '',
          instructions: null,
          studentOutputs: [],
          ratedRubrics: [],
          status: 'not_started'
        }))
      };

      setSectionPortfolios((prev) => ({ ...prev, [sectionId]: portfolio }));

      const nextDrafts = {};
      (portfolio?.slots || []).forEach((slot) => {
        nextDrafts[slot.slotNumber] = {
          title: slot.title || '',
          notes: slot.notes || ''
        };
      });
      setSlotDrafts((prev) => ({ ...prev, [sectionId]: nextDrafts }));
    } catch (error) {
      setPortfolioErrorBySection((prev) => ({
        ...prev,
        [sectionId]: error.message || 'Failed to load activity slots'
      }));
    } finally {
      setPortfolioLoadingFor('');
    }
  };

  const saveSlotMeta = async (sectionId, slotNumber) => {
    const draft = getDraftForSlot(sectionId, { slotNumber });

    try {
      const response = await fetch(`/api/section-portfolios/section/${sectionId}/slot/${slotNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: draft.title, notes: draft.notes })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Failed to save activity details');

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
        text: error.message || 'Failed to save activity details',
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  const uploadEvidence = async (sectionId, slotNumber, evidenceType) => {
    const selectedFiles = getSelectionForSlot(sectionId, slotNumber, evidenceType);
    if (!selectedFiles || selectedFiles.length === 0) {
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
      const response = await fetch(`/api/section-portfolios/section/${sectionId}/slot/${slotNumber}/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Upload failed');

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

  const toggleSlotEditor = (sectionId, slotNumber) => {
    setEditorOpenBySection((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [slotNumber]: !Boolean((prev[sectionId] || {})[slotNumber])
      }
    }));
  };

  const isSlotEditorOpen = (sectionId, slotNumber) => Boolean((editorOpenBySection[sectionId] || {})[slotNumber]);

  const selectSection = async (sectionId) => {
    const nextSectionId = currentSectionId === sectionId ? '' : sectionId;
    if (onSelectSection) onSelectSection(nextSectionId);
    else setExpandedSectionId(nextSectionId);

    if (nextSectionId) {
      await loadPortfolio(nextSectionId);
    }
  };

  const currentSections = sectionsByCourse[currentCourseId] || [];
  const currentSection = currentSections.find((section) => String(section._id) === String(currentSectionId)) || null;

  const renderEvidenceGroup = (label, files) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="outcome-evidence-group">
        <p>{label}</p>
        <div className="outcome-evidence-links">
          {files.map((file) => (
            <a
              key={file._id || file.fileName || file.fileUrl || file.path}
              href={toFileUrl(file)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {file.fileName || file.originalName || 'Uploaded file'} {fileLooksLikePreviewable(file) ? '(preview)' : '(open)'}
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (!currentCourseId) {
    return <div className="workspace-inline-empty">Select a course to continue.</div>;
  }

  return (
    <div className="workspace-body">
      <div className="workspace-sections-row">
        <p className="workspace-sections-label">Sections:</p>
        <div className="workspace-sections-chips">
          {(currentSections || []).map((section) => (
            <button
              key={section._id}
              type="button"
              onClick={() => selectSection(section._id)}
              className={`section-chip ${currentSectionId === section._id ? 'active' : ''}`}
            >
              {section.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="syllabus-outline-btn add-section-btn"
          onClick={() =>
            setActiveAddSectionCourse(courses.find((course) => String(course._id) === String(currentCourseId)) || null)
          }
        >
          + Add Section
        </button>
      </div>

      {sectionsErrorByCourse[currentCourseId] && (
        <div className="workspace-inline-error">{sectionsErrorByCourse[currentCourseId]}</div>
      )}

      {sectionsLoadingFor === currentCourseId && <div className="workspace-inline-empty">Loading sections...</div>}

      {!sectionsLoadingFor && currentSections.length === 0 && !sectionsErrorByCourse[currentCourseId] && (
        <div className="workspace-inline-empty">No sections yet for this course.</div>
      )}

      {currentSectionId ? (
        <div className="selected-section-wrapper">
          <h3>Selected Section: {currentSection?.name || 'Untitled Section'}</h3>

          {portfolioErrorBySection[currentSectionId] && (
            <div className="workspace-inline-error">{portfolioErrorBySection[currentSectionId]}</div>
          )}

          {portfolioLoadingFor === currentSectionId && <div className="workspace-inline-empty">Loading outcomes...</div>}

          {!portfolioLoadingFor && !portfolioErrorBySection[currentSectionId] && (
            <div className="outcomes-list">
              {(
                (sectionPortfolios[currentSectionId]?.slots || Array.from({ length: 4 }, (_, index) => ({
                  slotNumber: index + 1,
                  courseOutcomeNumber: index + 1,
                  activityNumber: index + 1,
                  title: '',
                  notes: '',
                  instructions: null,
                  studentOutputs: [],
                  ratedRubrics: [],
                  status: 'not_started'
                })))
                  .slice()
                  .sort((a, b) => a.slotNumber - b.slotNumber)
              ).map((slot) => {
                const draft = getDraftForSlot(currentSectionId, slot);
                const selectedInstructions = getSelectionForSlot(currentSectionId, slot.slotNumber, 'instructions');
                const selectedOutputs = getSelectionForSlot(currentSectionId, slot.slotNumber, 'studentOutputs');
                const selectedRubrics = getSelectionForSlot(currentSectionId, slot.slotNumber, 'ratedRubrics');
                const existingInstructions = slot.instructions ? [slot.instructions] : [];
                const activityPresent = slotHasActivity(slot);
                const editorOpen = isSlotEditorOpen(currentSectionId, slot.slotNumber);

                return (
                  <article key={`outcome-${slot.slotNumber}`} className="outcome-card">
                    <div className="outcome-card-header">
                      <h4>Course Outcome {slot.courseOutcomeNumber}</h4>
                      <button
                        type="button"
                        className="add-activity-btn"
                        onClick={() => toggleSlotEditor(currentSectionId, slot.slotNumber)}
                      >
                        {editorOpen ? 'Hide Activity Form' : '+ Add Activity'}
                      </button>
                    </div>

                    <div className="outcome-card-body">
                      {activityPresent ? (
                        <div className="activity-list">
                          <div className="activity-item">
                            <div className="activity-item-header">
                              <strong>
                                {hasCustomTitle(slot)
                                  ? slot.title
                                  : `Activity ${slot.activityNumber}`}
                              </strong>
                              <span className={`activity-status status-${String(slot.status || 'not_started')}`}>
                                {toStatusLabel(slot.status)}
                              </span>
                            </div>

                            {String(slot.notes || '').trim() && <p className="activity-notes">{slot.notes}</p>}

                            <div className="outcome-evidence-grid">
                              {renderEvidenceGroup('Instructions', existingInstructions)}
                              {renderEvidenceGroup('Student Outputs', slot.studentOutputs || [])}
                              {renderEvidenceGroup('Rated Rubrics', slot.ratedRubrics || [])}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="outcome-empty-state">No activity evidence uploaded yet.</div>
                      )}

                      {editorOpen && (
                        <div className="activity-editor">
                          <div className="activity-editor-field">
                            <label>Activity Title</label>
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(event) =>
                                setDraftForSlot(currentSectionId, slot.slotNumber, { title: event.target.value })
                              }
                              placeholder={getDefaultSlotTitle(slot.slotNumber)}
                            />
                          </div>

                          <div className="activity-editor-field">
                            <label>Notes</label>
                            <textarea
                              rows="3"
                              value={draft.notes}
                              onChange={(event) =>
                                setDraftForSlot(currentSectionId, slot.slotNumber, { notes: event.target.value })
                              }
                              placeholder="Add notes for this activity"
                            />
                          </div>

                          <div className="editor-upload-grid">
                            <div className="editor-upload-item">
                              <p>Instructions</p>
                              <input
                                type="file"
                                onChange={(event) =>
                                  setSelectionForSlot(
                                    currentSectionId,
                                    slot.slotNumber,
                                    'instructions',
                                    event.target.files?.[0] ? [event.target.files[0]] : []
                                  )
                                }
                              />
                              {selectedInstructions.length > 0 && (
                                <span className="selected-files-text">Selected: {selectedInstructions[0].name}</span>
                              )}
                              <button
                                type="button"
                                className="syllabus-outline-btn editor-upload-btn"
                                onClick={() => uploadEvidence(currentSectionId, slot.slotNumber, 'instructions')}
                              >
                                Upload Instructions
                              </button>
                            </div>

                            <div className="editor-upload-item">
                              <p>Student Outputs</p>
                              <input
                                type="file"
                                multiple
                                onChange={(event) =>
                                  setSelectionForSlot(
                                    currentSectionId,
                                    slot.slotNumber,
                                    'studentOutputs',
                                    Array.from(event.target.files || [])
                                  )
                                }
                              />
                              {selectedOutputs.length > 0 && (
                                <span className="selected-files-text">Selected: {selectedOutputs.length} file(s)</span>
                              )}
                              <button
                                type="button"
                                className="syllabus-outline-btn editor-upload-btn"
                                onClick={() => uploadEvidence(currentSectionId, slot.slotNumber, 'studentOutputs')}
                              >
                                Upload Student Outputs
                              </button>
                            </div>

                            <div className="editor-upload-item">
                              <p>Rated Rubrics</p>
                              <input
                                type="file"
                                multiple
                                onChange={(event) =>
                                  setSelectionForSlot(
                                    currentSectionId,
                                    slot.slotNumber,
                                    'ratedRubrics',
                                    Array.from(event.target.files || [])
                                  )
                                }
                              />
                              {selectedRubrics.length > 0 && (
                                <span className="selected-files-text">Selected: {selectedRubrics.length} file(s)</span>
                              )}
                              <button
                                type="button"
                                className="syllabus-outline-btn editor-upload-btn"
                                onClick={() => uploadEvidence(currentSectionId, slot.slotNumber, 'ratedRubrics')}
                              >
                                Upload Rated Rubrics
                              </button>
                            </div>
                          </div>

                          <div className="activity-editor-actions">
                            <button
                              type="button"
                              className="syllabus-primary-btn"
                              onClick={() => saveSlotMeta(currentSectionId, slot.slotNumber)}
                            >
                              Save Activity
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="workspace-inline-empty">Select a section to manage Course Outcome activities.</div>
      )}

      {activeAddSectionCourse && (
        <AddSectionModal
          courseId={activeAddSectionCourse._id}
          facultyId={facultyId}
          defaultSemester={activeAddSectionCourse.semester || ''}
          onClose={() => setActiveAddSectionCourse(null)}
          onSaved={async () => {
            await loadSections(activeAddSectionCourse._id);
          }}
        />
      )}
    </div>
  );
}

export default SyllabusSections;
