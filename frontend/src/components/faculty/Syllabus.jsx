import React, { useState, useContext, useEffect } from 'react';
import AuthContext from '../../contexts/AuthContext';
import './facultyComponents.css';
import Swal from 'sweetalert2';
import SyllabusSections from './SyllabusSections';

const VALID_SEMESTERS = ['First Semester', 'Second Semester'];

const normalizeText = (value) => (value || '').trim().toLowerCase();

const Syllabus = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [syllabi, setSyllabi] = useState([]);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [storageStatus, setStorageStatus] = useState({ isFull: null, message: 'Checking storage status...' });

    useEffect(() => {
        loadAssignedCourses();
        loadSyllabi();
        loadStorageStatus();
    }, []);

    const loadStorageStatus = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                setStorageStatus({ isFull: null, message: 'Storage status unavailable' });
                return;
            }

            const response = await fetch('http://localhost:5000/api/syllabus/storage-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setStorageStatus({
                isFull: typeof result.isFull === 'boolean' ? result.isFull : null,
                message: result.message || 'Storage status unavailable'
            });
        } catch (error) {
            console.error('Error fetching storage status:', error);
            setStorageStatus({ isFull: null, message: 'Storage status unavailable' });
        }
    };

    const loadAssignedCourses = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                return;
            }

            const response = await fetch('/api/teaching/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const courseList = Array.isArray(data?.courses) ? data.courses : [];
            const uniqueCourses = [];
            const seen = new Set();

            courseList.forEach((course) => {
                const key = String(course?._id || '');
                if (!key || seen.has(key)) {
                    return;
                }
                seen.add(key);
                uniqueCourses.push(course);
            });

            setAssignedCourses(uniqueCourses);
        } catch (error) {
            console.error('Error loading assigned courses for syllabus view:', error);
            setAssignedCourses([]);
        }
    };

    const loadSyllabi = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }

            const response = await fetch('http://localhost:5000/api/syllabus', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSyllabi(Array.isArray(data) ? data : (data.syllabi || []));
        } catch (error) {
            console.error('Error loading syllabi:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error loading syllabi: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const getSyllabusForCourse = (course) => {
        if (!course) return null;
        const normalizedCode = String(course.courseCode || '').trim().toLowerCase();
        return syllabi.find((syllabus) => String(syllabus.subjectCode || '').trim().toLowerCase() === normalizedCode) || null;
    };

    const isPdfFile = (file) => {
        if (!file) return false;
        const hasPdfMime = file.type === 'application/pdf';
        const hasPdfExtension = (file.name || '').toLowerCase().endsWith('.pdf');
        return hasPdfMime || hasPdfExtension;
    };

    const uploadSyllabus = async (course, file, semester, academicYear) => {
        try {
            const token = ensureToken();
            if (!token) throw new Error('Authentication required');

            const fd = new FormData();
            fd.append('subjectCode', course.courseCode);
            fd.append('subjectName', course.courseName || '');
            fd.append('academicYear', academicYear);
            fd.append('semester', semester);
            fd.append('syllabusFile', file);

            const response = await fetch('http://localhost:5000/api/syllabus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: fd
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Upload failed');

            setSyllabi((prev) => [
                ...prev.filter((s) => String(s.subjectCode || '').trim().toLowerCase() !== String(course.courseCode || '').trim().toLowerCase()),
                result.syllabus
            ]);

            Swal.fire({ icon: 'success', title: 'Uploaded', text: 'Syllabus saved to course reference.', timer: 1400, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Upload failed', text: err.message || 'Upload failed', confirmButtonColor: '#e74c3c' });
        }
    };

    const handleCourseFileChange = async (course, event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!isPdfFile(file)) {
            Swal.fire({ icon: 'error', title: 'Invalid format', text: 'Please upload a PDF file.' });
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

    const selectCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setSelectedSectionId('');
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <div>
                    <h2>Syllabus</h2>
                    <p>Organize teaching evidence by course, section, and activity.</p>
                </div>
            </div>

            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Assigned Courses</h3>
                        <p style={{ color: '#666', marginTop: '0.35rem' }}>Start with a course, then choose a section and upload activity evidence.</p>
                    </div>
                    <div style={{ minWidth: '240px', color: '#475569' }}>
                        {storageStatus.isFull === true ? <span style={{ color: '#d14343' }}>{storageStatus.message}</span> : <span>{storageStatus.message}</span>}
                    </div>
                </div>

                {assignedCourses.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '1.5rem' }}>
                        No assigned courses yet. Please upload a syllabus for an assigned subject or contact your administrator to get assigned.
                    </div>
                ) : (
                    <div className="course-grid">
                        {assignedCourses.map((course) => {
                            const matched = getSyllabusForCourse(course);
                            return (
                                <div key={course._id} className="course-card">
                                    <div className="course-card-header">
                                        <div>
                                            <div className="course-code">{course.courseCode}</div>
                                            <div className="course-name">{course.courseName}</div>
                                        </div>
                                        <div className="section-badge" style={{ background: matched ? '#ebf8ff' : '#fff4e5', color: matched ? '#2563eb' : '#ad5500' }}>
                                            {matched ? 'Syllabus available' : 'No syllabus yet'}
                                        </div>
                                    </div>

                                    <div className="course-meta">
                                        <div>
                                            <strong>Academic Year</strong>
                                            <div>{matched?.academicYear || 'TBD'}</div>
                                        </div>
                                        <div>
                                            <strong>Semester</strong>
                                            <div>{matched?.semester || course.semester || 'TBD'}</div>
                                        </div>
                                        <div>
                                            <strong>Section</strong>
                                            <div>{course.section || 'Not assigned'}</div>
                                        </div>
                                    </div>

                                    <div className="course-card-actions">
                                        {matched && (
                                            <a href={`http://localhost:5000${matched.syllabusFile?.fileUrl || matched.fileUrl || ''}`} target="_blank" rel="noopener noreferrer" className="action-btn view">
                                                View Syllabus
                                            </a>
                                        )}
                                        <label className="action-btn edit" style={{ cursor: 'pointer' }}>
                                            {matched ? 'Replace Syllabus' : 'Upload Syllabus'}
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleCourseFileChange(course, e)}
                                            />
                                        </label>
                                        <button className="save-button" onClick={() => selectCourse(course._id)} style={{ minWidth: '150px' }}>
                                            Manage Course
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedCourseId ? (
                <SyllabusSections
                    courses={assignedCourses}
                    facultyId={user?._id || user?.id}
                    ensureToken={ensureToken}
                    selectedCourseId={selectedCourseId}
                    selectedSectionId={selectedSectionId}
                    onSelectCourse={(id) => selectCourse(id)}
                    onSelectSection={(id) => setSelectedSectionId(id)}
                />
            ) : assignedCourses.length > 0 ? (
                <div className="content-card" style={{ marginTop: '1rem' }}>
                    <div className="empty-state">Select a course card above to open section activity evidence.</div>
                </div>
            ) : null}
        </div>
    );
};

export default Syllabus;
