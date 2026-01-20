import React from 'react';
import './CourseManagementTab.css';

const CourseManagementTab = ({
  user,
  courses,
  courseLoading,
  getCourseLockStatus,
  isCourseLockedByAnotherAdmin,
  onAddCourseClick,
  onAssignFacultyClick,
  onEditCourseClick,
  onDeleteCourseClick,
  courseAssignments,
  facultyData
}) => {
  return (
    <div className="course-management">
      <div className="section-header">
        <h3>Course Catalog</h3>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={onAddCourseClick}
          >
            + Add Course
          </button>
          <button
            className="btn-secondary"
            onClick={onAssignFacultyClick}
          >
            📋 Assign Faculty
          </button>
        </div>
      </div>

      <div className="2pl-info-banner">
        <div className="2pl-info-content">
          <strong>🔒 Backend Two-Phase Locking Active:</strong>
          <span> When you edit a course, it gets locked exclusively in the database. Other admins cannot edit it until you save or cancel.</span>
        </div>
        <div className="current-admin-info">
          You are logged in as: <strong>{user?.email || user?.name || 'Admin'}</strong>
        </div>
      </div>

      {courseLoading ? (
        <div className="loading-state">Loading courses...</div>
      ) : (
        <div className="courses-container">
          <div className="courses-grid">
            {courses.map((course) => {
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
                          {isLockedByMe ? '🔒 Your Lock' : `🔐 Locked by ${lockInfo.lockedBy}`}
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
                      onClick={() => onEditCourseClick(course)}
                      disabled={isLockedByOther}
                      title={isLockedByOther ? `Currently being edited by ${lockInfo.lockedBy}` : 'Edit course'}
                    >
                      {isLockedByOther ? '🔒 Locked' : 'Edit'}
                    </button>
                    <button
                      className="btn-action delete"
                      onClick={() => onDeleteCourseClick(course)}
                      disabled={isLockedByOther}
                      title={isLockedByOther ? 'Cannot delete - course is locked' : 'Delete course'}
                    >
                      Delete
                    </button>
                  </div>

                  {isLockedByOther && (
                    <div className="lock-warning">
                      <span className="warning-icon">⚠️</span>
                      <span>This course is currently being edited by {lockInfo.lockedBy}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {courses.length === 0 && (
            <div className="empty-state">
              No courses found. Click "Add Course" to create the first one.
            </div>
          )}
        </div>
      )}

      <div className="assignments-section">
        <h4>Current Course Assignments</h4>
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
                      {isCourseLocked && (
                        <span className="table-lock-indicator" title="Course is locked">
                          {' '}
                          🔒
                        </span>
                      )}
                    </td>
                    <td>{faculty ? faculty.name : 'Unknown Faculty'}</td>
                    <td>{assignment.semester}</td>
                    <td>{assignment.section}</td>
                    <td>
                      <button
                        className="btn-action delete"
                        disabled={isCourseLocked}
                        title={isCourseLocked ? 'Cannot remove - course is locked' : 'Remove assignment'}
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
              No course assignments found. Assign faculty to courses to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseManagementTab;

