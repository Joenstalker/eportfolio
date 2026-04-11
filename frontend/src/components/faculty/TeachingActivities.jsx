import React, { useState, useEffect } from 'react';
import CreateActivityModal from './CreateActivityModal';
import ActivityCard from './ActivityCard';

// Dummy fetch functions (replace with real API calls)
const fetchCourses = async () => [];
const fetchSections = async (courseId) => [];
const fetchActivities = async (courseId, section) => [];

export default function TeachingActivities({ facultyId }) {
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedSection) {
      fetchActivities(selectedCourse._id, selectedSection).then(setActivities);
    }
  }, [selectedCourse, selectedSection, showCreate]);

  return (
    <div className="teaching-activities">
      <h2>Teaching Activities</h2>
      {courses.length === 0 ? (
        <div className="empty-state">No assigned courses.</div>
      ) : (
        courses.map(course => (
          <div key={course._id} className="course-accordion card">
            <h3 onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}>
              {course.courseName}
            </h3>
            {expandedCourse === course._id && (
              <div className="sections-list">
                {(course.sections || []).map(section => (
                  <div key={section} className="section-accordion card">
                    <h4 onClick={() => {
                      setExpandedSection(expandedSection === section ? null : section);
                      setSelectedCourse(course);
                      setSelectedSection(section);
                    }}>
                      Section: {section}
                    </h4>
                    {expandedSection === section && (
                      <div>
                        <button onClick={() => setShowCreate(true)}>
                          Create Activity
                        </button>
                        {showCreate && (
                          <CreateActivityModal
                            courseId={course._id}
                            section={section}
                            facultyId={facultyId}
                            onClose={() => setShowCreate(false)}
                          />
                        )}
                        {activities.length === 0 ? (
                          <div className="empty-state">No activities yet.</div>
                        ) : (
                          activities.map(activity => (
                            <ActivityCard key={activity._id} activity={activity} />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
