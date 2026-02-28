import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './CourseManagementTab.css';

const CourseManagementTab = ({ user, facultyData }) => {
  // Generate semester options matching backend enum
  const generateSemesterOptions = () => {
    return [
      'First Semester',
      'Second Semester'
    ];
    return semesters;
  };
  
  const semesterOptions = generateSemesterOptions();
  const defaultSemester = 'First Semester';

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
    section: ''
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
    // Temporary debug logging
    console.log('Current form state:', newCourse);
    
    // Simple validation - check if required fields have content
    if (!newCourse.courseCode || newCourse.courseCode.trim() === '') {
      console.log('Course Code validation failed:', newCourse.courseCode);
      showErrorAlert('Please fill in the Course Code');
      return;
    }
    
    if (!newCourse.courseName || newCourse.courseName.trim() === '') {
      console.log('Course Name validation failed:', newCourse.courseName);
      showErrorAlert('Please fill in the Course Name');
      return;
    }
    
    if (!newCourse.department || newCourse.department.trim() === '') {
      console.log('Department validation failed:', newCourse.department);
      showErrorAlert('Please fill in the Department');
      return;
    }
    
    console.log('All validations passed!');

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
    
    if (!newAssignment.facultyId || !newAssignment.courseId) {
      console.log('❌ Validation failed - missing faculty or course');
      showErrorAlert('Please select both faculty and course');
      return;
    }

    console.log('✅ Form validation passed');

    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No authentication token found');
        showErrorAlert('Please log in again');
        return;
      }

      // First test if backend is reachable
      console.log('🔍 Testing backend connectivity...');
      try {
        const testResponse = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('🔍 Backend test response status:', testResponse.status);
      } catch (testError) {
        console.error('❌ Backend connectivity test failed:', testError);
        showErrorAlert('Cannot connect to backend server');
        return;
      }

      const assignmentData = {
        facultyId: newAssignment.facultyId,
        courseId: newAssignment.courseId,
        semester: newAssignment.semester,
        section: newAssignment.section
      };
      
      console.log('🚀 Sending assignment data:', assignmentData);
      
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('📡 Parsed response data:', responseData);
      } catch (e) {
        console.log('📡 Response is not JSON, using raw text');
        responseData = { message: responseText };
      }
      
      if (response.ok) {
        console.log('✅ Assignment created successfully');
        setNewAssignment({
          facultyId: '',
          courseId: '',
          semester: defaultSemester,
          section: ''
        });
        setShowAssignmentModal(false);
        showSuccessAlert('Faculty assigned to course successfully!');
        fetchCourseAssignments();
      } else {
        console.error('❌ Backend error:', responseData);
        showErrorAlert(responseData?.message || `Error ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      console.error('❌ Error stack:', error.stack);
      showErrorAlert('Network error: ' + error.message);
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

  // Form Management Functions
  const openAddCourseModal = () => {
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
    setShowCourseModal(true);
  };

  // Validation functions
  const isAddCourseFormValid = () => {
    return (
      newCourse.courseCode.trim() !== '' &&
      newCourse.courseName.trim() !== '' &&
      newCourse.department.trim() !== ''
    );
  };

  const isEditCourseFormValid = () => {
    return (
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
              onClick={() => openAddCourseModal()}
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

        </div>

      {/* Add Course Modal */}
      {showCourseModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => {
            if (isAddCourseFormValid()) {
              setShowCourseModal(false);
            } else {
              showWarningAlert('Please complete all required fields (marked with *) before closing.');
            }
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              minWidth: '550px',
              maxWidth: '650px',
              margin: 'auto',
              background: 'var(--admin-surface)',
              borderRadius: 'var(--admin-radius)',
              boxShadow: 'var(--admin-shadow-lg)',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              border: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--admin-surface)',
                minHeight: '72px'
              }}
            >
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--admin-text)',
                letterSpacing: '-0.5px'
              }}>
                Add New Course
              </h3>
              <button 
                style={{
                  background: '#fef2f2',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  fontWeight: '400',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onClick={() => {
                  if (isAddCourseFormValid()) {
                    setShowCourseModal(false);
                  } else {
                    showWarningAlert('Please complete all required fields (marked with *) before closing.');
                  }
                }}
              >
                ✕
              </button>
            </div>
            <div 
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
                flex: 1,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newCourse.courseCode}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  placeholder="e.g., CS101"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
                  placeholder="e.g., Introduction to Computer Science"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Credits
                </label>
                <input
                  type="number"
                  value={newCourse.credits}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Department *
                </label>
                <input
                  type="text"
                  value={newCourse.department}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Computer Science"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Semester
                </label>
                <select
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '40px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem} style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>{sem}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={newCourse.maxStudents}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 28px',
                background: 'var(--admin-surface)'
              }}
            >
              <button 
                onClick={() => setShowCourseModal(false)}
                style={{
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  border: '1px solid var(--admin-border)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '120px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-surface-2)';
                  e.target.style.borderColor = 'var(--admin-muted)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-surface)';
                  e.target.style.borderColor = 'var(--admin-border)';
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCourse}
                style={{
                  background: 'var(--admin-primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '140px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-primary-600)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-primary)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                }}
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedCourse && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => {
            if (isEditCourseFormValid()) {
              handleCancelEditCourse();
            } else {
              showWarningAlert('Please complete all required fields before closing. The lock will be released.');
            }
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              minWidth: '550px',
              maxWidth: '650px',
              margin: 'auto',
              background: 'var(--admin-surface)',
              borderRadius: 'var(--admin-radius)',
              boxShadow: 'var(--admin-shadow-lg)',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              border: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--admin-surface)',
                minHeight: '72px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: 'var(--admin-text)',
                  letterSpacing: '-0.5px'
                }}>
                  Edit Course
                </h3>
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  Editing
                </span>
              </div>
              <button 
                style={{
                  background: '#fef2f2',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  fontWeight: '400',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onClick={() => {
                  if (isEditCourseFormValid()) {
                    handleCancelEditCourse();
                  } else {
                    showWarningAlert('Please complete all required fields before closing. The lock will be released.');
                  }
                }}
              >
                ✕
              </button>
            </div>
            <div 
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
                flex: 1,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  value={editCourse.courseCode || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  value={editCourse.courseName || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Description
                </label>
                <textarea
                  value={editCourse.description || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Credits
                </label>
                <input
                  type="number"
                  value={editCourse.credits || 3}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Department *
                </label>
                <input
                  type="text"
                  value={editCourse.department || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, department: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Semester
                </label>
                <select
                  value={editCourse.semester || defaultSemester}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, semester: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '40px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem} style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>{sem}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={editCourse.maxStudents || 30}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 28px',
                background: 'var(--admin-surface)'
              }}
            >
              <button 
                onClick={() => handleCancelEditCourse()}
                style={{
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  border: '1px solid var(--admin-border)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '160px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-surface-2)';
                  e.target.style.borderColor = 'var(--admin-muted)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-surface)';
                  e.target.style.borderColor = 'var(--admin-border)';
                }}
              >
                Cancel & Release Lock
              </button>
              <button 
                onClick={handleEditCourse}
                style={{
                  background: 'var(--admin-primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '200px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-primary-600)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-primary)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                }}
              >
                Save Changes & Release Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignmentModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => {
            if (isAssignFacultyFormValid()) {
              setShowAssignmentModal(false);
            } else {
              showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
            }
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              minWidth: '550px',
              maxWidth: '650px',
              margin: 'auto',
              background: 'var(--admin-surface)',
              borderRadius: 'var(--admin-radius)',
              boxShadow: 'var(--admin-shadow-lg)',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              border: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--admin-surface)',
                minHeight: '72px'
              }}
            >
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--admin-text)',
                letterSpacing: '-0.5px'
              }}>
                Assign Faculty to Course
              </h3>
              <button 
                style={{
                  background: '#fef2f2',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  fontWeight: '400',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fef2f2';
                  e.target.style.color = '#dc2626';
                }}
                onClick={() => {
                  if (isAssignFacultyFormValid()) {
                    setShowAssignmentModal(false);
                  } else {
                    showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
                  }
                }}
              >
                ✕
              </button>
            </div>
            <div 
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
                flex: 1,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Select Faculty *
                </label>
                <select
                  value={newAssignment.facultyId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, facultyId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '40px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Faculty Member</option>
                  {facultyData.filter(f => f.isActive).map(faculty => (
                    <option key={faculty._id} value={faculty._id} style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>
                      {faculty.firstName} {faculty.lastName} - {faculty.department}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Select Course *
                </label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '40px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Course</option>
                  {courses.filter(c => c.status === 'active').map(course => (
                    <option key={course._id} value={course._id} style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Semester
                </label>
                <select
                  value={newAssignment.semester}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, semester: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '40px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem} style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>{sem}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  color: 'var(--admin-text)', 
                  marginBottom: '4px'
                }}>
                  Section Code
                </label>
                <input
                  type="text"
                  value={newAssignment.section}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    background: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--admin-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--admin-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 28px',
                background: 'var(--admin-surface)'
              }}
            >
              <button 
                onClick={() => setShowAssignmentModal(false)}
                style={{
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  border: '1px solid var(--admin-border)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '120px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-surface-2)';
                  e.target.style.borderColor = 'var(--admin-muted)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-surface)';
                  e.target.style.borderColor = 'var(--admin-border)';
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignFaculty}
                style={{
                  background: 'var(--admin-primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  minWidth: '140px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--admin-primary-600)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px -1px rgba(37, 99, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--admin-primary)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                }}
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
