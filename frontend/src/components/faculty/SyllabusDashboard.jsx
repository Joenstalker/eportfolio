import React, { useContext, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import AuthContext from '../../contexts/AuthContext';
import SyllabusSections from './SyllabusSections';
import './SyllabusDashboard.css';

const API_ORIGIN = 'http://localhost:5000';

const toSyllabusFileUrl = (syllabus) => {
  const rawPath = syllabus?.syllabusFile?.fileUrl || syllabus?.fileUrl || '';
  if (!rawPath) return '';
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (rawPath.startsWith('/')) return `${API_ORIGIN}${rawPath}`;
  return `${API_ORIGIN}/${rawPath}`;
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / (1024 ** index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${sizes[index]}`;
};

export default function SyllabusDashboard() {
  const { user, ensureToken } = useContext(AuthContext);

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [storageStatus, setStorageStatus] = useState({
    isFull: null,
    message: 'Checking storage status...',
    freeBytes: null
  });

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [manualFile, setManualFile] = useState(null);
  const [manualFileInputKey, setManualFileInputKey] = useState(0);
  const [manualSubjectCode, setManualSubjectCode] = useState('');
  const [manualSubjectName, setManualSubjectName] = useState('');
  const [manualSemester, setManualSemester] = useState('');
  const [manualAcademicYear, setManualAcademicYear] = useState('');

  useEffect(() => {
    loadAssignedCourses();
    loadSyllabi();
    loadStorageStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = () => {
    const token = ensureToken?.() || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadAssignedCourses = async () => {
    try {
      const response = await fetch('/api/teaching/courses', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch assigned courses');

      const payload = await response.json();
      const courseList = Array.isArray(payload?.courses) ? payload.courses : [];
      const uniqueCourses = [];
      const seenIds = new Set();

      courseList.forEach((course) => {
        const key = String(course?._id || '');
        if (!key || seenIds.has(key)) return;
        seenIds.add(key);
        uniqueCourses.push(course);
      });

      setAssignedCourses(uniqueCourses);
    } catch (error) {
      console.error('Error loading assigned courses:', error);
      setAssignedCourses([]);
    }
  };

  const loadSyllabi = async () => {
    try {
      const response = await fetch('/api/syllabus', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch syllabi');

      const payload = await response.json();
      setSyllabi(Array.isArray(payload) ? payload : payload?.syllabi || []);
    } catch (error) {
      console.error('Error loading syllabi:', error);
      setSyllabi([]);
    }
  };

  const loadStorageStatus = async () => {
    try {
      const response = await fetch('/api/syllabus/storage-status', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch storage status');

      const payload = await response.json();
      setStorageStatus({
        isFull: typeof payload?.isFull === 'boolean' ? payload.isFull : null,
        message: payload?.message || 'Storage status unavailable',
        freeBytes: Number.isFinite(payload?.freeBytes) ? payload.freeBytes : null
      });
    } catch (error) {
      console.error('Error fetching storage status:', error);
      setStorageStatus({ isFull: null, message: 'Storage status unavailable', freeBytes: null });
    }
  };

  const getSyllabusForCourse = (course) => {
    if (!course) return null;
    const normalizedCode = String(course.courseCode || '').trim().toLowerCase();
    return syllabi.find((item) => String(item.subjectCode || '').trim().toLowerCase() === normalizedCode) || null;
  };

  const isPdfFile = (file) => {
    if (!file) return false;
    const hasPdfMime = file.type === 'application/pdf';
    const hasPdfExtension = String(file.name || '').toLowerCase().endsWith('.pdf');
    return hasPdfMime || hasPdfExtension;
  };

  const uploadSyllabus = async (course, file, semester, academicYear) => {
    try {
      const token = ensureToken?.() || localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const createBody = () => {
        const formData = new FormData();
        formData.append('subjectCode', course.courseCode);
        formData.append('subjectName', course.courseName || '');
        formData.append('academicYear', academicYear);
        formData.append('semester', semester);
        formData.append('syllabusFile', file);
        return formData;
      };

      let uploadResponse = await fetch('/api/syllabus', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: createBody()
      });

      let uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok) {
        const message = String(uploadPayload?.message || '').toLowerCase();
        const isDuplicate = message.includes('syllabus exists');

        if (isDuplicate) {
          const normalizedCode = String(course.courseCode || '').trim().toLowerCase();
          const existingSyllabus = syllabi.find(
            (item) => String(item.subjectCode || '').trim().toLowerCase() === normalizedCode
          );

          if (!existingSyllabus?._id) {
            throw new Error(uploadPayload.message || 'Upload failed');
          }

          const deleteResponse = await fetch(`/api/syllabus/${existingSyllabus._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          const deletePayload = await deleteResponse.json();
          if (!deleteResponse.ok) {
            throw new Error(deletePayload?.message || 'Unable to replace syllabus');
          }

          uploadResponse = await fetch('/api/syllabus', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: createBody()
          });
          uploadPayload = await uploadResponse.json();
        }
      }

      if (!uploadResponse.ok) {
        throw new Error(uploadPayload?.message || 'Upload failed');
      }

      await Promise.all([loadAssignedCourses(), loadSyllabi()]);
      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: 'Syllabus saved to course reference.',
        timer: 1400,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Upload failed',
        text: error.message || 'Upload failed',
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  const handleCourseFileChange = async (course, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isPdfFile(file)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid format',
        text: 'Please upload a PDF file.'
      });
      event.target.value = '';
      return;
    }

    const { value: semester } = await Swal.fire({
      title: 'Semester',
      input: 'select',
      inputOptions: {
        'First Semester': 'First Semester',
        'Second Semester': 'Second Semester'
      },
      inputPlaceholder: 'Select semester',
      showCancelButton: true
    });
    if (!semester) {
      event.target.value = '';
      return;
    }

    const { value: academicYear } = await Swal.fire({
      title: 'Academic Year',
      input: 'text',
      inputPlaceholder: 'e.g., 2024-2025',
      showCancelButton: true
    });
    if (!academicYear) {
      event.target.value = '';
      return;
    }

    await uploadSyllabus(course, file, semester, academicYear);
    event.target.value = '';
  };

  const handleManualUpload = async () => {
    if (storageStatus.isFull === true) {
      Swal.fire({
        icon: 'warning',
        title: 'Storage Full',
        text: 'Uploads are currently unavailable. Please contact your administrator.'
      });
      return;
    }

    if (!manualFile) {
      Swal.fire({
        icon: 'warning',
        title: 'No file selected',
        text: 'Please choose a PDF file.'
      });
      return;
    }

    if (!isPdfFile(manualFile)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid format',
        text: 'Only PDF files are accepted.'
      });
      return;
    }

    if (!manualSubjectCode || !manualSubjectName || !manualSemester || !manualAcademicYear) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing fields',
        text: 'Please complete all fields before uploading.'
      });
      return;
    }

    await uploadSyllabus(
      { courseCode: manualSubjectCode, courseName: manualSubjectName },
      manualFile,
      manualSemester,
      manualAcademicYear
    );

    setManualFile(null);
    setManualSubjectCode('');
    setManualSubjectName('');
    setManualSemester('');
    setManualAcademicYear('');
    setManualFileInputKey((value) => value + 1);
  };

  const selectCourse = (courseId) => {
    setSelectedCourseId(String(courseId));
    setSelectedSectionId('');
  };

  const selectedCourse = useMemo(
    () => assignedCourses.find((course) => String(course._id) === String(selectedCourseId)) || null,
    [assignedCourses, selectedCourseId]
  );

  const selectedCourseSyllabus = useMemo(
    () => getSyllabusForCourse(selectedCourse),
    [selectedCourse, syllabi]
  );

  const uploadStorageContext = useMemo(() => {
    if (storageStatus.isFull === true) {
      return {
        tone: 'danger',
        title: 'Syllabus Upload Storage',
        detail: 'Storage is full. New uploads are temporarily unavailable.'
      };
    }

    if (storageStatus.isFull === false) {
      const freeSpace = formatBytes(storageStatus.freeBytes);
      return {
        tone: 'ok',
        title: 'Syllabus Upload Storage',
        detail: freeSpace ? `Ready: ${freeSpace} available for uploads.` : 'Ready for new uploads.'
      };
    }

    return {
      tone: 'neutral',
      title: 'Syllabus Upload Storage',
      detail: 'Storage status is currently unavailable.'
    };
  }, [storageStatus.freeBytes, storageStatus.isFull]);

  const workspaceSemester = selectedCourseSyllabus?.semester || selectedCourse?.semester || 'Semester not set';
  const workspaceAcademicYear = selectedCourseSyllabus?.academicYear || 'Academic Year not set';
  const selectedCourseSyllabusUrl = toSyllabusFileUrl(selectedCourseSyllabus);

  return (
    <div className="syllabus-page">
      <header className="syllabus-page-header">
        <h1>Syllabus</h1>
        <p>Manage your syllabus, sections, and course outcome activity evidence</p>
      </header>

      <section className="syllabus-card">
        <div className="syllabus-card-top">
          <div>
            <h2>Assigned Courses</h2>
            <p>Start with a course, then choose a section and upload activity evidence.</p>
          </div>
          <span className="card-context-pill">Course Workspace</span>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="assigned-courses-empty">
            <div className="empty-state-icon" aria-hidden="true">SYLLABUS</div>
            <h3>No courses available yet</h3>
            <p>Upload a syllabus to create your course record.</p>
            <p className="empty-state-note">
              Once uploaded, this area will show your course workspace for sections and activity evidence.
            </p>
            <a href="#upload-syllabus-card" className="empty-state-link">Go to Upload Syllabus</a>
          </div>
        ) : (
          <div className="assigned-course-list">
            {assignedCourses.map((course) => {
              const matchedSyllabus = getSyllabusForCourse(course);
              const matchedSyllabusUrl = toSyllabusFileUrl(matchedSyllabus);
              const isActive = String(course._id) === String(selectedCourseId);

              return (
                <article key={course._id} className={`assigned-course-item ${isActive ? 'active' : ''}`}>
                  <div className="assigned-course-main">
                    <div className="assigned-course-title-row">
                      <h3>{course.courseName || 'Untitled Course'}</h3>
                      <span className={`assigned-course-tag ${matchedSyllabus ? 'tag-ready' : 'tag-missing'}`}>
                        {matchedSyllabus ? 'Syllabus Uploaded' : 'No Syllabus'}
                      </span>
                    </div>
                    <p className="assigned-course-code">{course.courseCode || 'No subject code'}</p>
                  </div>

                  <div className="assigned-course-actions">
                    {matchedSyllabusUrl && (
                      <a
                        href={matchedSyllabusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="syllabus-outline-btn"
                      >
                        View Syllabus
                      </a>
                    )}

                    <label className="syllabus-outline-btn">
                      {matchedSyllabus ? 'Replace Syllabus' : 'Upload Syllabus'}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(event) => handleCourseFileChange(course, event)}
                      />
                    </label>

                    <button type="button" className="syllabus-primary-btn" onClick={() => selectCourse(course._id)}>
                      {isActive ? 'Selected' : 'Open Workspace'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {assignedCourses.length > 0 && !selectedCourse && (
          <p className="workspace-hint">
            Next step: Select <strong>Open Workspace</strong> on a course to manage sections and activity evidence.
          </p>
        )}
      </section>

      <section id="upload-syllabus-card" className="syllabus-card">
        <div className="syllabus-card-top upload-top">
          <div>
            <h2>Upload Syllabus</h2>
            <p>Complete the fields below and upload one PDF syllabus file.</p>
          </div>

          <div className={`storage-pill ${uploadStorageContext.tone}`}>
            <span className="storage-pill-title">{uploadStorageContext.title}</span>
            <span className="storage-pill-detail">{uploadStorageContext.detail}</span>
          </div>
        </div>

        <div className="upload-form-panel">
          <div className="upload-form-grid">
            <div className="upload-field">
              <label htmlFor="manualSubjectCode">Subject Code</label>
              <input
                id="manualSubjectCode"
                type="text"
                value={manualSubjectCode}
                onChange={(event) => setManualSubjectCode(event.target.value)}
                placeholder="Subject Code"
              />
            </div>

            <div className="upload-field">
              <label htmlFor="manualSubjectName">Subject Name</label>
              <input
                id="manualSubjectName"
                type="text"
                value={manualSubjectName}
                onChange={(event) => setManualSubjectName(event.target.value)}
                placeholder="Subject Name"
              />
            </div>

            <div className="upload-field">
              <label htmlFor="manualSemester">Semester</label>
              <select
                id="manualSemester"
                value={manualSemester}
                onChange={(event) => setManualSemester(event.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </div>

            <div className="upload-field">
              <label htmlFor="manualAcademicYear">Academic Year</label>
              <input
                id="manualAcademicYear"
                type="text"
                value={manualAcademicYear}
                onChange={(event) => setManualAcademicYear(event.target.value)}
                placeholder="YYYY-YYYY"
              />
            </div>
          </div>

          <div className="upload-file-row">
            <div className="upload-file-field">
              <label htmlFor="manualSyllabusFile">Syllabus File (PDF)</label>
              <input
                id="manualSyllabusFile"
                key={manualFileInputKey}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setManualFile(event.target.files?.[0] || null)}
              />
              <p className="selected-file-name">{manualFile?.name || 'No file selected yet.'}</p>
            </div>

            <button
              type="button"
              className="syllabus-primary-btn primary-upload-btn"
              onClick={handleManualUpload}
              disabled={storageStatus.isFull === true}
            >
              Upload Syllabus
            </button>
          </div>
        </div>

        <p className="upload-flow-note">
          Once uploaded, your course will appear in <strong>Assigned Courses</strong> so you can proceed to sections and
          course outcome activity evidence.
        </p>
      </section>

      {selectedCourse && (
        <section className="syllabus-card course-workspace-card">
          <div className="workspace-header">
            <div>
              <h2>
                {selectedCourse.courseName || 'Untitled Course'} ({selectedCourse.courseCode || 'No Code'})
              </h2>
              <p>
                {workspaceAcademicYear} | {workspaceSemester}
              </p>
            </div>

            <div className="workspace-header-actions">
              {selectedCourseSyllabusUrl && (
                <a
                  href={selectedCourseSyllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="syllabus-outline-btn"
                >
                  View Syllabus
                </a>
              )}

              <label className="syllabus-outline-btn">
                {selectedCourseSyllabus ? 'Replace Syllabus' : 'Upload Syllabus'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(event) => handleCourseFileChange(selectedCourse, event)}
                />
              </label>
            </div>
          </div>

          <SyllabusSections
            courses={assignedCourses}
            facultyId={user?._id || user?.id}
            ensureToken={ensureToken}
            selectedCourseId={selectedCourseId}
            selectedSectionId={selectedSectionId}
            onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
            onSelectSection={(sectionId) => setSelectedSectionId(sectionId)}
          />
        </section>
      )}
    </div>
  );
}
