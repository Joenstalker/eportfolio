import React from 'react';
import './ArchivedCoursesTab.css';

const ArchivedCoursesTab = ({ archivedCourses, onUnarchiveClick }) => {
  return (
    <div className="archived-courses">
      <div className="section-header">
        <h3>Archived Courses</h3>
      </div>

      {archivedCourses.length === 0 ? (
        <div className="empty-state">No archived courses.</div>
      ) : (
        <div className="courses-grid">
          {archivedCourses.map((course) => (
            <div key={course._id} className="course-card archived">
              <div className="course-header">
                <h4>{course.courseCode}</h4>
                <span className="course-status archived">archived</span>
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
                  className="btn-action unarchive"
                  onClick={() => onUnarchiveClick(course)}
                >
                  Unarchive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivedCoursesTab;
