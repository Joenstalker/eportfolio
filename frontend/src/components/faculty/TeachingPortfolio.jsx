import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';
import TeachingActivities from './TeachingActivities';

const TeachingPortfolio = () => {
    const { user, ensureToken, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadAssignedCourses();
        }
    }, [user]);

    const loadAssignedCourses = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('/api/teaching/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                logout?.();
                await Swal.fire({
                    title: 'Session Expired',
                    text: 'Please log in again to continue.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                navigate('/login');
                return;
            }
            
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
                <div>
                    <h2>Teaching Portfolio</h2>
                    <p>View your assigned courses and manage teaching activities</p>
                </div>
                <button
                    className="action-btn classlists"
                    onClick={() => navigate(`/faculty/${user?._id || user?.id}/class-lists`)}
                >
                    View Class Lists
                </button>
            </div>
            <TeachingActivities facultyId={user?._id || user?.id} />
        </div>
    );
};

export default TeachingPortfolio;