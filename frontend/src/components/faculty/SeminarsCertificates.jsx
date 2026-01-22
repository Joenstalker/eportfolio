import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const SeminarsCertificates = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [seminars, setSeminars] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loadingVenues, setLoadingVenues] = useState(true);
    const [showAddVenue, setShowAddVenue] = useState(false);
    const [customVenue, setCustomVenue] = useState('');
    const [newSeminar, setNewSeminar] = useState({
        title: '',
        date: '',
        organizer: '',
        venue: '',
        duration: '',
        certificateFile: null
    });

    useEffect(() => {
        // Load seminars and venues from database
        loadSeminars();
        loadVenues();
    }, []);

    const loadSeminars = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/seminars', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setSeminars(Array.isArray(data) ? data : (data.seminars || []));
        } catch (error) {
            console.error('Error loading seminars:', error);
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
                    text: `Error loading seminars: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const loadVenues = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/venues', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setVenues(data);
        } catch (error) {
            console.error('Error loading venues:', error);
            // Fallback to default venues if there's an error
            setVenues(['Main Hall', 'Conference Room A', 'Virtual Zoom', 'Hotel Ballroom']);
        } finally {
            setLoadingVenues(false);
        }
    };

    const handleFileChange = (e) => {
        setNewSeminar({...newSeminar, certificateFile: e.target.files[0]});
    };

    const addSeminar = async () => {
        let finalVenue = newSeminar.venue;
        let venueToAdd = null;
        
        if (showAddVenue && customVenue) {
            finalVenue = customVenue;
            venueToAdd = customVenue;
        }
        
        // If a new venue needs to be added, create it first
        if (venueToAdd) {
            try {
                const token = ensureToken();
                const venueResponse = await fetch('http://localhost:5000/api/venues', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: venueToAdd })
                });
                
                if (!venueResponse.ok) {
                    const errorData = await venueResponse.json();
                    // If venue already exists, that's okay, we can still proceed
                    if (errorData.message !== 'Venue already exists') {
                        throw new Error(errorData.message || 'Error adding venue');
                    }
                }
            } catch (error) {
                console.error('Error adding venue:', error);
                // Continue with the seminar creation even if venue creation fails
            }
        }

        if (!newSeminar.title || !newSeminar.date || !newSeminar.organizer) {
            Swal.fire({
                title: 'Missing Fields!',
                text: 'Please fill in all required fields',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        try {
            const token = ensureToken();
            if (!token) {
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            const formData = new FormData();
            formData.append('title', newSeminar.title);
            formData.append('date', newSeminar.date);
            formData.append('organizer', newSeminar.organizer);
            formData.append('venue', finalVenue);
            formData.append('duration', newSeminar.duration || '');
            if (newSeminar.certificateFile) {
                formData.append('certificate', newSeminar.certificateFile);
            }

            const response = await fetch('http://localhost:5000/api/seminars', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setSeminars([...seminars, result.seminar]);
            setNewSeminar({
                title: '', date: '', organizer: '', venue: '', duration: '', certificateFile: null
            });
            setCustomVenue('');
            setShowAddVenue(false);
            document.getElementById('certificate-upload').value = '';
            // Reload venues to include any newly added ones
            loadVenues();
            Swal.fire({
                title: 'Seminar Added!',
                text: 'Your seminar details have been saved.',
                icon: 'success',
                confirmButtonColor: '#3498db'
            });
        } catch (error) {
            console.error('Error adding seminar:', error);
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
                    text: `Error adding seminar: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Seminars and Certificates</h2>
                <p>Manage your seminar participations and certificates</p>
            </div>

            <div className="content-card">
                <h3>Add New Seminar</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Seminar Title *</label>
                        <input
                            type="text"
                            value={newSeminar.title}
                            onChange={(e) => setNewSeminar({...newSeminar, title: e.target.value})}
                            placeholder="Enter seminar title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Date *</label>
                        <input
                            type="date"
                            value={newSeminar.date}
                            onChange={(e) => setNewSeminar({...newSeminar, date: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Organizer *</label>
                        <input
                            type="text"
                            value={newSeminar.organizer}
                            onChange={(e) => setNewSeminar({...newSeminar, organizer: e.target.value})}
                            placeholder="Enter organizer name"
                        />
                    </div>
                    {/* Implement a dropdown menu for the Venue field under Seminars and Certificates, including an “Add Venue” option for new entries. */}
                    <div className="form-group">
                        <label>Venue</label>
                        {loadingVenues ? (
                            <div>Loading venues...</div>
                        ) : !showAddVenue ? (
                            <select
                                value={newSeminar.venue}
                                onChange={(e) => {
                                    if (e.target.value === 'ADD_NEW') {
                                        setShowAddVenue(true);
                                    } else {
                                        setNewSeminar({...newSeminar, venue: e.target.value});
                                    }
                                }}
                            >
                                <option value="">Select Venue</option>
                                {venues.map(v => (
                                    <option key={typeof v === 'string' ? v : v._id} value={typeof v === 'string' ? v : v.name}>
                                        {typeof v === 'string' ? v : v.name}
                                    </option>
                                ))}
                                <option value="ADD_NEW">+ Add Venue</option>
                            </select>
                        ) : (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="text"
                                    value={customVenue}
                                    onChange={(e) => setCustomVenue(e.target.value)}
                                    placeholder="Enter new venue"
                                    style={{ flex: 1 }}
                                />
                                <button 
                                    className="action-btn delete" 
                                    onClick={() => {
                                        setShowAddVenue(false);
                                        setCustomVenue('');
                                    }}
                                    style={{ padding: '5px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Duration (hours)</label>
                        <input
                            type="number"
                            value={newSeminar.duration}
                            onChange={(e) => setNewSeminar({...newSeminar, duration: e.target.value})}
                            placeholder="Duration in hours"
                        />
                    </div>
                    <div className="form-group">
                        <label>Certificate</label>
                        <input
                            id="certificate-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addSeminar}>
                    Add Seminar
                </button>

                <div className="items-list" style={{marginTop: '2rem'}}>
                    <h3>Your Seminars</h3>
                    {seminars.map(seminar => (
                        <div key={seminar._id} className="item-card">
                            <div className="item-header">
                                <h4>{seminar.title}</h4>
                                <span className="section-badge">{seminar.date}</span>
                            </div>
                            <p><strong>Organizer:</strong> {seminar.organizer}</p>
                            <p><strong>Venue:</strong> {seminar.venue}</p>
                            <p><strong>Duration:</strong> {seminar.duration} hours</p>
                            {seminar.certificateFile?.fileUrl && (
                                <a href={`http://localhost:5000${seminar.certificateFile.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                    View Certificate
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeminarsCertificates;