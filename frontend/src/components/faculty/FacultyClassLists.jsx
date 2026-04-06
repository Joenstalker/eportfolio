import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthContext from '../../contexts/AuthContext';
import './facultyComponents.css';

const FacultyClassLists = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, ensureToken } = useContext(AuthContext);

    const [classLists, setClassLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = ensureToken();
                if (!token) throw new Error('Authentication required.');

                const response = await fetch(`/api/teaching/class-lists?facultyId=${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                setClassLists(Array.isArray(data.classLists) ? data.classLists : []);
            } catch (e) {
                console.error('FacultyClassLists fetch error', e);
                setError(e.message);
                Swal.fire({ icon: 'error', title: 'Error', text: e.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, ensureToken]);

    const isSelf = user && (user._id === id || user.id === id);

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Class Lists</h2>
                <p>{isSelf ? 'Your class lists' : 'Class lists'}</p>
                <button className="action-btn view" onClick={() => navigate('/teaching-portfolio')}>
                    Back to Teaching Portfolio
                </button>
            </div>

            <div className="content-card">
                {loading ? (
                    <p>Loading class lists...</p>
                ) : error ? (
                    <p className="error-text">{error}</p>
                ) : classLists.length === 0 ? (
                    <p>No class lists available.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="classlists-table">
                            <thead>
                                <tr>
                                    <th>Course Code</th>
                                    <th>Course Name</th>
                                    <th>Section</th>
                                    <th>Semester</th>
                                    <th>Students</th>
                                    <th>Schedule</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classLists.map((item) => (
                                    <tr key={item.assignmentId || item.courseId || `${item.courseCode}-${item.section}`}>
                                        <td>{item.courseCode || 'N/A'}</td>
                                        <td>{item.courseName || 'N/A'}</td>
                                        <td>{item.section || 'N/A'}</td>
                                        <td>{item.semester || 'N/A'}</td>
                                        <td>{item.studentCount ?? 0}</td>
                                        <td>{item.schedule || 'TBA'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyClassLists;
