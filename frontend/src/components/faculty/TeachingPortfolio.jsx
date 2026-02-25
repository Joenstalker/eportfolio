import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const TeachingPortfolio = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAssignedCourses();
    }, []);

    const loadAssignedCourses = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/teaching/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setAssignedCourses(data.courses || []);
        } catch (error) {
            console.error('Error loading assigned courses:', error);
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
                    text: `Error loading assigned courses: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Teaching Portfolio</h2>
                <p>View your assigned courses and manage teaching activities</p>
            </div>

            <div className="content-card">
                <h3>Your Assigned Courses ({assignedCourses.length})</h3>
                
                {/* Assigned Courses List */}
                <div className="items-list">
                    {assignedCourses.length === 0 ? (
                        <div className="empty-state">
                            <p>No courses assigned to you yet. Courses will appear here once assigned by administrators.</p>
                        </div>
                    ) : (
                        assignedCourses.map(course => (
                            <div key={course._id} className="item-card">
                                <div className="item-header">
                                    <h4>{course.courseCode} - {course.courseName}</h4>
                                    <span className="section-badge">{course.section}</span>
                                </div>
                                <p><strong>Department:</strong> {course.department}</p>
                                <p><strong>Semester:</strong> {course.semester}</p>
                                <p><strong>Credits:</strong> {course.credits}</p>
                                <p><strong>Max Students:</strong> {course.maxStudents}</p>
                                {course.description && (
                                    <p><strong>Description:</strong> {course.description}</p>
                                )}
                                <div className="item-actions">
                                    <button className="action-btn view">View Details</button>
                                    <button className="action-btn edit">Manage</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachingPortfolio;