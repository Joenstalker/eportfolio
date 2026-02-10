import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './CourseManagementTab.css';

const CourseManagementTab = ({ user, facultyData }) => {
  // Generate semester options matching backend enum
  const generateSemesterOptions = () => {
    return [
      'Fall 2024',
      'Spring 2025', 
      'Summer 2025',
      'Fall 2025'
    ];
    return semesters;
  };
  
  const semesterOptions = generateSemesterOptions();
  const defaultSemester = 'Fall 2025';

  // Course Management State
  const [courses, setCourses] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    credits: 3,
    department: '',
    semester: defaultSemester,
    maxStudents: 30,
    prerequisites: []
  });
  const [editCourse, setEditCourse] = useState({});
  const [courseAssignments, setCourseAssignments] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    facultyId: '',
    courseId: '',
    semester: defaultSemester,
    section: 'A'
  });
  const [courseLocks, setCourseLocks] = useState({});

  // ==================== SWEETALERT HELPER FUNCTIONS ====================
  const showSuccessAlert = (message, title = 'Success') => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const showErrorAlert = (message, title = 'Error') => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonColor: '#d33'
    });
  };

  const showWarningAlert = (message, title = 'Warning') => {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonColor: '#ff9800'
    });
  };

  // ==================== BACKEND 2PL API FUNCTIONS ====================
  const lockCourseOnBackend = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(`Locked by ${errorData.lockInfo?.lockedByUsername || 'another admin'}`);
      }

      if (!response.ok) {
        throw new Error('Failed to acquire lock');
      }

      const data = await response.json();
      
      setCourseLocks(prev => ({
        ...prev,
        [courseId]: {
          isLocked: true,
          lockedByMe: true,
          lockedBy: user?.name || user?.firstName || 'You',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      }));
      
      return { success: true, lock: data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const unlockCourseOnBackend = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to release lock');
      }

      setCourseLocks(prev => ({
        ...prev,
        [courseId]: {
          isLocked: false,
          lockedByMe: false,
          lockedBy: null
        }
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const checkCourseLockStatus = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/lock-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isLocked) {
          setCourseLocks(prev => ({
            ...prev,
            [courseId]: {
              isLocked: true,
              lockedByMe: data.lockInfo?.lockedBy === (user?.name || user?.firstName || 'You') || false,
              lockedBy: data.lockInfo?.lockedByUsername || 'Another admin',
              expiresAt: data.lockInfo?.acquiredAt
            }
          }));
        } else {
          setCourseLocks(prev => ({
            ...prev,
            [courseId]: {
              isLocked: false,
              lockedByMe: false,
              lockedBy: null
            }
          }));
        }
        
        return data;
      }
      return { isLocked: false };
    } catch (error) {
      console.error('Error checking lock status:', error);
      return { isLocked: false };
    }
  };

  // ==================== COURSE MANAGEMENT API FUNCTIONS ====================
  const fetchCourses = async () => {
    setCourseLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        
        // Update lock status for each course
        data.forEach(course => {
          if (course.isLocked && course.lockInfo) {
            setCourseLocks(prev => ({
              ...prev,
              [course._id]: {
                isLocked: true,
                lockedByMe: course.lockInfo.lockedBy === user?._id,
                lockedBy: course.lockInfo.lockedByUsername,
                expiresAt: course.lockInfo.acquiredAt
              }
            }));
          } else {
            setCourseLocks(prev => ({
              ...prev,
              [course._id]: {
                isLocked: false,
                lockedByMe: false,
                lockedBy: null
              }
            }));
          }
        });
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchCourseAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourseAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      setCourseAssignments([]);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.courseCode || !newCourse.courseName || !newCourse.department) {
      showErrorAlert('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('➕ Adding new course:', newCourse);
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCourse)
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Course created successfully:', result);
        
        setCourses(prev => [...prev, result]);
        setShowCourseModal(false);
        setNewCourse({
          courseCode: '',
          courseName: '',
          description: '',
          credits: 3,
          department: '',
          semester: defaultSemester,
          maxStudents: 30,
          prerequisites: []
        });
        showSuccessAlert('Course added successfully!');
        fetchCourses(); // Refresh the course list
      } else {
        const error = await response.json();
        console.error('❌ Error response:', error);
        showErrorAlert(error.message || 'Error adding course');
      }
    } catch (error) {
      console.error('❌ Add course error:', error);
      showErrorAlert(`Error adding course: ${error.message}`);
    }
  };

  const handleEditCourseClick = async (course) => {
    const lockStatus = await checkCourseLockStatus(course._id);
    
    if (lockStatus.isLocked) {
      if (lockStatus.lock?.isLockedByMe) {
        setSelectedCourse(course);
        setEditCourse({ ...course });
        setShowEditCourseModal(true);
        showSuccessAlert(`You already have the lock for ${course.courseCode}`);
        return;
      } else {
        showErrorAlert(
          `This course is currently locked by ${lockStatus.lock?.lockedBy || 'another admin'}. ` +
          `Please try again later.`
        );
        return;
      }
    }
    
    const lockResult = await lockCourseOnBackend(course._id);
    
    if (lockResult.success) {
      setSelectedCourse(course);
      setEditCourse({ ...course });
      setShowEditCourseModal(true);
      showSuccessAlert(`Lock acquired for editing ${course.courseCode}`);
    } else {
      showErrorAlert(`Failed to acquire lock: ${lockResult.message}`);
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      
      console.log('📝 Updating course:', {
        courseId: selectedCourse._id,
        changes: editCourse
      });
      
      const response = await fetch(`/api/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editCourse)
      });

      if (response.status === 409) {
        const error = await response.json();
        throw new Error(`Lock conflict: ${error.message}`);
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Course updated successfully:', result.course);
        
        // Close modal and clear state
        setShowEditCourseModal(false);
        setSelectedCourse(null);
        setEditCourse({});
        
        // Release the lock
        await unlockCourseOnBackend(selectedCourse._id);
        
        // Refresh courses from database to get latest data
        await fetchCourses();
        
        showSuccessAlert('Course updated successfully!');
      } else {
        const error = await response.json();
        console.error('❌ Error updating course:', error);
        throw new Error(error.message || 'Error updating course');
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      showErrorAlert(error.message);
    }
  };

  const handleCancelEditCourse = async () => {
    if (selectedCourse) {
      await unlockCourseOnBackend(selectedCourse._id);
    }
    setShowEditCourseModal(false);
    setSelectedCourse(null);
    setEditCourse({});
  };

  const handleArchiveCourse = async (course) => {
    const result = await Swal.fire({
      title: 'Archive Course?',
      text: `Archive ${course.courseCode} - ${course.courseName}? It will be moved to archived courses.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#111827',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const lockResult = await lockCourseOnBackend(course._id);
      if (!lockResult.success) {
        showErrorAlert(`Cannot archive: ${lockResult.message}`);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${course._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'archived' })
      });

      if (response.ok) {
        const result = await response.json();
        setCourses(prev =>
          prev.map(c => c._id === course._id ? result.course : c)
        );
        
        await unlockCourseOnBackend(course._id);
        
        showSuccessAlert('Course archived successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error archiving course');
      }
    } catch (error) {
      console.error('Error archiving course:', error);
      showErrorAlert('Error archiving course');
    }
  };

  const handleAssignFaculty = async () => {
    console.log('🔍 Assignment form state:', newAssignment);
    console.log('🔍 Faculty ID:', newAssignment.facultyId);
    console.log('🔍 Course ID:', newAssignment.courseId);
    
    if (!newAssignment.facultyId || !newAssignment.courseId) {
      showErrorAlert('Please select both faculty and course');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAssignment)
      });

      if (response.ok) {
        const result = await response.json();
        setCourseAssignments(prev => [...prev, result.assignment]);
        setShowAssignmentModal(false);
        setNewAssignment({
          facultyId: '',
          courseId: '',
          semester: defaultSemester,
          section: 'A'
        });
        showSuccessAlert('Faculty assigned to course successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error assigning faculty');
      }
    } catch (error) {
      console.error('Error assigning faculty:', error);
      showErrorAlert('Error assigning faculty');
    }
  };

  // Helper functions
  const isCourseLockedByAnotherAdmin = (courseId) => {
    const lock = courseLocks[courseId];
    return lock?.isLocked && !lock?.lockedByMe;
  };

  const getCourseLockStatus = (courseId) => {
    return courseLocks[courseId] || { isLocked: false, lockedByMe: false, lockedBy: null };
  };

  // Validation functions
  const isAddCourseFormValid = () => {
    return !showCourseModal || (
      newCourse.courseCode.trim() !== '' &&
      newCourse.courseName.trim() !== '' &&
      newCourse.department.trim() !== ''
    );
  };

  const isEditCourseFormValid = () => {
    return !showEditCourseModal || (
      editCourse.courseCode?.trim() !== '' &&
      editCourse.courseName?.trim() !== '' &&
      editCourse.department?.trim() !== ''
    );
  };

  const isAssignFacultyFormValid = () => {
    return !showAssignmentModal || (
      newAssignment.facultyId !== '' &&
      newAssignment.courseId !== ''
    );
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses();
    fetchCourseAssignments();
  }, []);

  // Auto-refresh lock statuses
  useEffect(() => {
    const refreshLocks = async () => {
      if (courses.length > 0) {
        await Promise.all(
          courses.slice(0, 10).map(course => 
            checkCourseLockStatus(course._id)
          )
        );
      }
    };

    const interval = setInterval(refreshLocks, 10000);
    
    return () => clearInterval(interval);
  }, [courses]);

  return (
    <>
      <div className="course-management">
        <div className="section-header">
          <h3>Course Catalog</h3>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowCourseModal(true)}
            >
              + Add Course
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowAssignmentModal(true)}
            >
              Assign Faculty
            </button>
          </div>
        </div>

        {courseLoading ? (
          <div className="loading-state">Loading courses...</div>
        ) : (
          <div className="courses-container">
            <div className="courses-grid">
              {courses.filter(c => c.status !== 'archived').map((course) => {
                const lockInfo = getCourseLockStatus(course._id);
                const isLocked = lockInfo.isLocked;
                const isLockedByMe = lockInfo.lockedByMe;
                const isLockedByOther = isLocked && !isLockedByMe;

                return (
                  <div
                    key={course._id}
                    className={`course-card ${isLocked ? 'locked' : ''} ${isLockedByMe ? 'locked-by-me' : ''}`}
                  >
                    <div className="course-header">
                      <h4>{course.courseCode}</h4>
                      <div className="course-status-group">
                        <span className={`course-status ${course.status || 'active'}`}>
                          {course.status || 'active'}
                        </span>
                        {isLocked && (
                          <span className={`lock-indicator ${isLockedByMe ? 'my-lock' : 'other-lock'}`}>
                            {isLockedByMe ? 'Editing' : `Locked by ${lockInfo.lockedBy}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="course-body">
                      <h5>{course.courseName}</h5>
                      <p className="course-description">{course.description}</p>
                      <div className="course-details">
                        <div className="course-detail">
                          <span className="detail-label">Department:</span>
                          <span className="detail-value">{course.department}</span>
                        </div>
                        <div className="course-detail">
                          <span className="detail-label">Credits:</span>
                          <span className="detail-value">{course.credits}</span>
                        </div>
                        <div className="course-detail">
                          <span className="detail-label">Semester:</span>
                          <span className="detail-value">{course.semester}</span>
                        </div>
                        <div className="course-detail">
                          <span className="detail-label">Max Students:</span>
                          <span className="detail-value">{course.maxStudents}</span>
                        </div>
                      </div>
                    </div>
                    <div className="course-actions">
                      <button
                        className={`btn-action edit ${isLockedByOther ? 'disabled' : ''}`}
                        onClick={() => handleEditCourseClick(course)}
                        disabled={isLockedByOther}
                        title={isLockedByOther ? `Locked by ${lockInfo.lockedBy}` : 'Edit course'}
                      >
                        {isLockedByOther ? 'Locked' : 'Edit'}
                      </button>
                      <button
                        className="btn-action archive"
                        onClick={() => handleArchiveCourse(course)}
                        disabled={isLockedByOther}
                        title={isLockedByOther ? 'Cannot archive - course is locked' : 'Archive course'}
                      >
                        Archive
                      </button>
                    </div>

                    {isLockedByOther && (
                      <div className="lock-warning">
                        Locked by {lockInfo.lockedBy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {courses.filter(c => c.status !== 'archived').length === 0 && (
              <div className="empty-state">
                No courses found. Click "Add Course" to create one.
              </div>
            )}
          </div>
        )}

        <div className="assignments-section">
          <h4>Course Assignments</h4>
          <div className="assignments-table">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Semester</th>
                  <th>Section</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courseAssignments.map((assignment) => {
                  const course = courses.find((c) => c._id === assignment.courseId);
                  const faculty = facultyData.find((f) => f._id === assignment.facultyId);
                  const isCourseLocked = isCourseLockedByAnotherAdmin(assignment.courseId);

                  return (
                    <tr key={assignment._id}>
                      <td>
                        {course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course'}
                        {isCourseLocked && <span className="table-lock-indicator"> (Locked)</span>}
                      </td>
                      <td>{faculty ? faculty.name : 'Unknown Faculty'}</td>
                      <td>{assignment.semester}</td>
                      <td>{assignment.section}</td>
                      <td>
                        <button
                          className="btn-action delete"
                          disabled={isCourseLocked}
                          title={isCourseLocked ? 'Course is locked' : 'Remove assignment'}
                        >
                          {isCourseLocked ? 'Locked' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {courseAssignments.length === 0 && (
              <div className="empty-state">
                No course assignments found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => {
          if (isAddCourseFormValid()) {
            setShowCourseModal(false);
          } else {
            showWarningAlert('Please complete all required fields (marked with *) before closing.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Course</h3>
              <button className="close-btn" onClick={() => {
                if (isAddCourseFormValid()) {
                  setShowCourseModal(false);
                } else {
                  showWarningAlert('Please complete all required fields (marked with *) before closing.');
                }
              }}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={newCourse.courseCode}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  value={newCourse.credits}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={newCourse.department}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Students</label>
                <input
                  type="number"
                  value={newCourse.maxStudents}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCourseModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddCourse}
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => {
          if (isEditCourseFormValid()) {
            handleCancelEditCourse();
          } else {
            showWarningAlert('Please complete all required fields before closing. The lock will be released.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Edit Course</h3>
                <span className="lock-badge">Editing</span>
              </div>
              <button className="close-btn" onClick={() => {
                if (isEditCourseFormValid()) {
                  handleCancelEditCourse();
                } else {
                  showWarningAlert('Please complete all required fields before closing. The lock will be released.');
                }
              }}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Course Code</label>
                <input
                  type="text"
                  value={editCourse.courseCode || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={editCourse.courseName || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editCourse.description || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  value={editCourse.credits || 3}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editCourse.department || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={editCourse.semester || defaultSemester}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, semester: e.target.value }))}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Students</label>
                <input
                  type="number"
                  value={editCourse.maxStudents || 30}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => handleCancelEditCourse()}>
                Cancel & Release Lock
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditCourse}
              >
                Save Changes & Release Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => {
          if (isAssignFacultyFormValid()) {
            setShowAssignmentModal(false);
          } else {
            showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Faculty to Course</h3>
              <button className="close-btn" onClick={() => {
                if (isAssignFacultyFormValid()) {
                  setShowAssignmentModal(false);
                } else {
                  showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
                }
              }}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Select Faculty *</label>
                <select
                  value={newAssignment.facultyId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, facultyId: e.target.value }))}
                >
                  <option value="">Select Faculty Member</option>
                  {facultyData.filter(f => f.isActive).map(faculty => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.firstName} {faculty.lastName} - {faculty.department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Course *</label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                >
                  <option value="">Select Course</option>
                  {courses.filter(c => c.isActive).map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={newAssignment.semester}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, semester: e.target.value }))}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={newAssignment.section}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAssignmentModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAssignFaculty}
              >
                Assign Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseManagementTab;
